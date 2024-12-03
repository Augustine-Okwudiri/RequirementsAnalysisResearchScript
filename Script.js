const { Builder, By, Key, until } = require('selenium-webdriver');
const fs = require('fs');

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

  it('Scrape Google Scholar', async function () {
    // Open Google Scholar
    await driver.get("https://scholar.google.com/");
    await driver.manage().window().setRect({ width: 1200, height: 800 });

    // Enter search query and click search
    await driver.findElement(By.id("gs_hdr_tsi")).sendKeys("use of AI in requirements analysis", Key.RETURN);

    // Wait for results to load
    await driver.wait(until.elementLocated(By.css(".gs_r.gs_or.gs_scl")), 10000);

    let results = [];
    let pagesToScrape = 2;

    for (let page = 1; page <= pagesToScrape; page++) {
      // Locate all result containers
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
      }

      // Click "Next" to go to the next page
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

    // Save results to a .txt file
    let output = results.map((r, i) => {
      return `Result ${i + 1}:\nTitle: ${r.title}\nAbstract: ${r.abstract}\nDownload Link: ${r.downloadLink}\n\n`;
    }).join("");

    fs.writeFileSync("scholar_results.txt", output);

    console.log("Scraping completed. Results saved to scholar_results.txt.");
  });
});
