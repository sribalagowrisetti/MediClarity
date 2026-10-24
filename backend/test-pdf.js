const fs = require("fs");
const pdfParse = require("pdf-parse");

async function extractPDF() {
    try {
        const files = fs.readdirSync("./uploads");

        const pdfFiles = files.filter(file =>
            file.toLowerCase().endsWith(".pdf")
        );

        if (pdfFiles.length === 0) {
            console.log("No PDF file found in uploads folder.");
            return;
        }

        const fileName = pdfFiles[pdfFiles.length - 1];

        const filePath = "./uploads/" + fileName;

        console.log("Testing PDF:");
        console.log(fileName);

        const dataBuffer = fs.readFileSync(filePath);

        const result = await pdfParse(dataBuffer);

        console.log("\n===== EXTRACTED MEDICAL REPORT TEXT =====\n");
        console.log(result.text);

        console.log("\n===== PDF EXTRACTION SUCCESS =====");

    } catch (error) {

        console.error("\n===== PDF EXTRACTION ERROR =====");
        console.error(error);

    }
}

extractPDF();