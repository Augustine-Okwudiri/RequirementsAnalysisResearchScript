const { Builder, By, Key, until } = require('selenium-webdriver');
const fs = require('fs');
const API_KEY = ""; // Your OpenAI API Key

const API_URL = "https://api.openai.com/v1/chat/completions";

// Function to call OpenAI API
const fetchAIResponse = async (title, abstract) => {
    const requestOptions = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "user",
                    content: `I want you to only answer yes or no.`,
                },
                {
                    role: "user",
                    content: `Would the following be relevant when researching "use of AI in requirements analysis"?\n\nTitle: ${title}\nAbstract: ${abstract}`,
                },
            ],
        }),
    };

    try {
        const response = await fetch(API_URL, requestOptions);
        if (!response.ok) {
            throw new Error("Failed to fetch AI response");
        }

        const data = await response.json();
        const assistantMessage = data.choices[0].message.content.trim();
        return assistantMessage.toLowerCase() === "yes";
    } catch (error) {
        console.error("Error fetching AI response:", error);
        return false; // Default to false if there's an error
    }
};

describe('Google Scholar Scraper', function () {
    this.timeout(30000); // Extend timeout if necessary
    let driver;
    let vars;

    beforeEach(async function () {
        driver = await new Builder().forBrowser('chrome').build();
        vars = {};
    });

    afterEach(async function () {
        await driver.quit();
    });

    it('Scrape Google Scholar and filter results', async function () {
        await driver.get("https://scholar.google.com/");
        await driver.manage().window().setRect({ width: 1200, height: 800 });

        // Enter search query and click search
        await driver.findElement(By.id("gs_hdr_tsi")).sendKeys("use of AI in requirements analysis", Key.RETURN);

        // Wait for results to load
        await driver.wait(until.elementLocated(By.css(".gs_r.gs_or.gs_scl")), 10000);

        let results = [];
        let verifiedResults = [];
        let pagesToScrape = 2;

        for (let page = 1; page <= pagesToScrape; page++) {
            let papers = await driver.findElements(By.css(".gs_r.gs_or.gs_scl"));

            for (let paper of papers) {
                let title, abstract, downloadLink;

                try {
                    title = await paper.findElement(By.css(".gs_ri h3")).getText();
                } catch (e) {
                    title = "Title not found";
                }

                try {
                    abstract = await paper.findElement(By.css(".gs_rs")).getText();
                } catch (e) {
                    abstract = "Abstract not found";
                }

                try {
                    downloadLink = await paper.findElement(By.css(".gs_or_ggsm a")).getAttribute("href");
                } catch (e) {
                    downloadLink = "No download link";
                }

                results.push({ title, abstract, downloadLink });

                // Call OpenAI API for verification
                const isRelevant = await fetchAIResponse(title, abstract);

                if (isRelevant) {
                    verifiedResults.push({ title, abstract, downloadLink });
                }
            }

            if (page < pagesToScrape) {
                try {
                    let nextButton = await driver.findElement(By.linkText("Next"));
                    await nextButton.click();
                    await driver.wait(until.elementLocated(By.css(".gs_r.gs_or.gs_scl")), 10000);
                } catch (e) {
                    console.log("No more pages available or CAPTCHA triggered.");
                    break;
                }
            }
        }

        // Save verified results to a .txt file
        let output = verifiedResults.map((r, i) => {
            return `Verified Result ${i + 1}:\nTitle: ${r.title}\nAbstract: ${r.abstract}\nDownload Link: ${r.downloadLink}\n\n`;
        }).join("");

        fs.writeFileSync("verified_scholar_results.txt", output);

        console.log("Scraping and filtering completed. Verified results saved to verified_scholar_results.txt.");
    });
});