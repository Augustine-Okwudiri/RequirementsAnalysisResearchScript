import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.util.Scanner;

public class ArticleProcessor {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);

        // Step 1: Get folder path from the user
        System.out.print("Enter the folder path containing the downloaded articles: ");
        String folderPath = scanner.nextLine().replace("\"", ""); // Remove quotes if present
        File folder = new File(folderPath);

        if (!folder.exists() || !folder.isDirectory()) {
            System.out.println("An error occurred: Invalid folder path specified: " + folder.getAbsolutePath());
            return;
        }

        System.out.println("Folder path is valid: " + folder.getAbsolutePath());

        // Step 2: List PDF files in the folder
        File[] files = folder.listFiles((dir, name) -> name.toLowerCase().endsWith(".pdf"));

        if (files == null || files.length == 0) {
            System.out.println("No PDF files found in the folder.");
            return;
        }

        System.out.println("PDF files to process:");
        for (File file : files) {
            System.out.println(file.getName());
        }

        // Step 3: Get output file path from the user
        System.out.print("Enter the name of the output text file (e.g., ProcessedArticles.txt): ");
        String outputPath = scanner.nextLine().replace("\"", ""); // Remove quotes if present
        File outputFile = new File(outputPath);

        // Step 4: Extract content from PDFs and write to the output file
        try (FileWriter writer = new FileWriter(outputFile)) {
            for (File file : files) {
                writer.write("Processing file: " + file.getName() + "\n");
                try (PDDocument document = PDDocument.load(file)) {
                    PDFTextStripper pdfStripper = new PDFTextStripper();
                    String pdfContent = pdfStripper.getText(document);
                    writer.write("Content of " + file.getName() + ":\n");
                    writer.write(pdfContent + "\n\n");
                } catch (IOException e) {
                    writer.write("Error reading PDF file: " + file.getName() + "\n");
                }
            }
            System.out.println("Processed information written to: " + outputFile.getAbsolutePath());
        } catch (IOException e) {
            System.out.println("An error occurred while writing to the output file: " + e.getMessage());
        }
    }
}
