const fs = require("fs");
const { PDFParse } = require("pdf-parse");

async function extractPDF() {
    try {
        const dataBuffer = fs.readFileSync(
            "./uploads/sample-medical-report.pdf"
        );

        const parser = new PDFParse({
            data: dataBuffer
        });

        const result = await parser.getText();

        console.log("===== EXTRACTED MEDICAL REPORT TEXT =====");
        console.log(result.text);

        await parser.destroy();

    } catch (error) {
        console.error("PDF extraction error:", error);
    }
}

extractPDF();