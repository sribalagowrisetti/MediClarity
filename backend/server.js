
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const pdfParse = require("pdf-parse");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Create uploads folder
const uploadDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// File upload configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const safeName = file.originalname.replace(
            /[^a-zA-Z0-9._-]/g, "_"
        );
        cb(null, Date.now() + "-" + safeName);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if ([
            "application/pdf",
            "image/jpeg",
            "image/png"
        ].includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("Only PDF, JPG and PNG files are supported."));
        }
    }
});

// Home route
app.get("/", (req, res) => {
    res.send("MediClarity Backend is running successfully.");
});

// General test information
function getTestInformation(name) {
    const test = name.toLowerCase();

    if (test.includes("haemoglobin") || test.includes("hemoglobin")) {
        return {
            whatIsIt: "Haemoglobin is a protein in red blood cells that carries oxygen around the body.",
            foodGuidance: "Include iron-rich foods such as leafy vegetables, beans, lentils and dates. Vitamin C foods help iron absorption."
        };
    }

    if (test.includes("glucose") || test.includes("blood sugar")) {
        return {
            whatIsIt: "Blood glucose is the amount of sugar in your blood. It provides energy to your body.",
            foodGuidance: "Choose vegetables, whole grains, beans and high-fibre foods. Limit sugary drinks and sweets."
        };
    }

    if (test.includes("cholesterol")) {
        return {
            whatIsIt: "Cholesterol is a fat-like substance in your blood that your body needs in limited amounts.",
            foodGuidance: "Choose vegetables, fruits, whole grains and beans. Limit foods high in saturated and trans fats."
        };
    }

    if (test.includes("vitamin d")) {
        return {
            whatIsIt: "Vitamin D helps your body use calcium and supports healthy bones and muscles.",
            foodGuidance: "Include suitable vitamin D food sources. Ask a healthcare professional before taking supplements."
        };
    }

    if (test.includes("wbc") || test.includes("white blood")) {
        return {
            whatIsIt: "WBC means white blood cells. They help protect your body from infections.",
            foodGuidance: "Eat a balanced diet with fruits, vegetables, pulses and protein-rich foods."
        };
    }

    return {
        whatIsIt: "This test provides information about your health.",
        foodGuidance: "Maintain a balanced diet and consult a healthcare professional about your results."
    };
}

// Calculate status using the supplied reference range
function getStatus(value, range) {
    const text = range.toLowerCase();

    if (text.includes("less than")) {
        const match = text.match(/[\d.]+/);
        if (match) return value < Number(match[0]) ? "NORMAL" : "HIGH";
    }

    if (text.includes("greater than") || text.includes("more than")) {
        const match = text.match(/[\d.]+/);
        if (match) return value > Number(match[0]) ? "NORMAL" : "LOW";
    }

    const numbers = text.match(/[\d.]+/g);

    if (numbers && numbers.length >= 2) {
        const low = Number(numbers[0]);
        const high = Number(numbers[1]);

        if (value < low) return "LOW";
        if (value > high) return "HIGH";
        return "NORMAL";
    }

    return "UNKNOWN";
}

// English explanation
function getEnglishExplanation(name, value, unit, range, status) {
    if (status === "LOW") {
        return `Your ${name} result is ${value} ${unit}, below the report's reference range of ${range}.`;
    }

    if (status === "HIGH") {
        return `Your ${name} result is ${value} ${unit}, above the report's reference range of ${range}.`;
    }

    if (status === "NORMAL") {
        return `Your ${name} result is ${value} ${unit}, within the report's reference range of ${range}.`;
    }

    return `Your ${name} result is ${value} ${unit}. Please check the reference range with your healthcare professional.`;
}

// Telugu explanation
function getTeluguExplanation(name, value, unit, range, status) {
    let statusText = "ఇది ఇచ్చిన సాధారణ పరిమితిలో ఉంది.";

    if (status === "LOW") {
        statusText = "ఇది ఇచ్చిన సాధారణ పరిమితి కంటే తక్కువగా ఉంది.";
    } else if (status === "HIGH") {
        statusText = "ఇది ఇచ్చిన సాధారణ పరిమితి కంటే ఎక్కువగా ఉంది.";
    } else if (status === "UNKNOWN") {
        statusText = "దయచేసి ఈ ఫలితం గురించి వైద్య నిపుణులను సంప్రదించండి.";
    }

    const explanations = {
        haemoglobin: "హీమోగ్లోబిన్ ఎర్ర రక్త కణాల ద్వారా శరీరానికి ఆక్సిజన్ అందించడంలో సహాయపడుతుంది.",
        glucose: "బ్లడ్ గ్లూకోజ్ అంటే రక్తంలో ఉన్న చక్కెర పరిమాణం. ఇది శరీరానికి శక్తిని అందిస్తుంది.",
        cholesterol: "కొలెస్ట్రాల్ రక్తంలో ఉండే కొవ్వు లాంటి పదార్థం.",
        vitamin: "విటమిన్ D ఎముకలు మరియు కండరాల ఆరోగ్యానికి సహాయపడుతుంది.",
        wbc: "తెల్ల రక్త కణాలు శరీరాన్ని ఇన్ఫెక్షన్ల నుంచి రక్షించడంలో సహాయపడతాయి."
    };

    const lower = name.toLowerCase();
    let meaning = "ఈ పరీక్ష మీ ఆరోగ్యానికి సంబంధించిన సమాచారాన్ని అందిస్తుంది.";

    if (lower.includes("haemoglobin") || lower.includes("hemoglobin")) {
        meaning = explanations.haemoglobin;
    } else if (lower.includes("glucose")) {
        meaning = explanations.glucose;
    } else if (lower.includes("cholesterol")) {
        meaning = explanations.cholesterol;
    } else if (lower.includes("vitamin d")) {
        meaning = explanations.vitamin;
    } else if (lower.includes("wbc")) {
        meaning = explanations.wbc;
    }

    return `${meaning} మీ ఫలితం ${value} ${unit}. ఇచ్చిన పరిమితి ${range}. ${statusText}`;
}

// Create a result object
function createResult(name, value, unit, range) {
    const status = getStatus(value, range);
    const info = getTestInformation(name);

    return {
        testName: name,
        value,
        unit,
        referenceRange: range,
        status,
        whatIsIt: info.whatIsIt,
        englishExplanation: getEnglishExplanation(
            name, value, unit, range, status
        ),
        teluguExplanation: getTeluguExplanation(
            name, value, unit, range, status
        ),
        foodGuidance: info.foodGuidance
    };
}

// Extract a test value and reference range by test name.
// Allows whitespace and line breaks between fields.
function findTest(text, namePattern, unitPattern, rangePattern) {
    const regex = new RegExp(
        namePattern +
        "[\\s\\S]{0,100}?" +
        "Patient\\s*Value\\s*:\\s*([\\d,]+(?:\\.\\d+)?)\\s*" +
        "(" + unitPattern + ")" +
        "[\\s\\S]{0,100}?" +
        "Reference\\s*Range\\s*:\\s*" +
        rangePattern,
        "i"
    );

    const match = text.match(regex);
    if (!match) return null;

    return match;
}

// Upload and analyze PDF
app.post("/upload", upload.single("medicalReport"), async (req, res) => {
    let filePath = null;

    try {
        if (!req.file) {
            return res.status(400).json({
                message: "No medical report was uploaded."
            });
        }

        filePath = req.file.path;

        if (req.file.mimetype !== "application/pdf") {
            return res.status(400).json({
                message: "Currently, text extraction is supported for PDF files only."
            });
        }

        const buffer = fs.readFileSync(filePath);
        const pdfData = await pdfParse(buffer);
        const text = pdfData.text || "";

        console.log("\n========== EXTRACTED PDF TEXT ==========");
        console.log(text);
        console.log("========================================\n");

        const normalizedText = text
            .replace(/\r/g, "\n")
            .replace(/\u00A0/g, " ")
            .replace(/[ \t]+/g, " ")
            .replace(/[‐‑‒–—]/g, "-")
            .trim();

        const results = [];

        // Haemoglobin
        let match = findTest(
            normalizedText,
            "Haemoglobin",
            "g\\s*\\/\\s*dL",
            "([\\d.]+)\\s*-\\s*([\\d.]+)\\s*g\\s*\\/\\s*dL"
        );

        if (match) {
            results.push(createResult(
                "Haemoglobin",
                Number(match[1].replace(/,/g, "")),
                "g/dL",
                `${match[3]} - ${match[4]} g/dL`
            ));
        }

        // Fasting blood glucose
        match = findTest(
            normalizedText,
            "Blood\\s+Glucose\\s*\\(?\\s*Fasting\\s*\\)?",
            "mg\\s*\\/\\s*dL",
            "([\\d.]+)\\s*-\\s*([\\d.]+)\\s*mg\\s*\\/\\s*dL"
        );

        if (match) {
            results.push(createResult(
                "Blood Glucose (Fasting)",
                Number(match[1].replace(/,/g, "")),
                "mg/dL",
                `${match[3]} - ${match[4]} mg/dL`
            ));
        }

        // Total cholesterol
        match = findTest(
            normalizedText,
            "Total\\s+Cholesterol",
            "mg\\s*\\/\\s*dL",
            "Less\\s+than\\s*([\\d.]+)\\s*mg\\s*\\/\\s*dL"
        );

        if (match) {
            results.push(createResult(
                "Total Cholesterol",
                Number(match[1].replace(/,/g, "")),
                "mg/dL",
                `Less than ${match[3]} mg/dL`
            ));
        }

        // Vitamin D
        match = findTest(
            normalizedText,
            "Vitamin\\s+D",
            "ng\\s*\\/\\s*mL",
            "([\\d.]+)\\s*-\\s*([\\d.]+)\\s*ng\\s*\\/\\s*mL"
        );

        if (match) {
            results.push(createResult(
                "Vitamin D",
                Number(match[1].replace(/,/g, "")),
                "ng/mL",
                `${match[3]} - ${match[4]} ng/mL`
            ));
        }

        // WBC count
        match = findTest(
            normalizedText,
            "WBC\\s+Count",
            "cells?\\s*\\/\\s*(?:μ|µ|u)L",
            "([\\d,]+)\\s*-\\s*([\\d,]+)\\s*cells?\\s*\\/\\s*(?:μ|µ|u)L"
        );

        if (match) {
            results.push(createResult(
                "WBC Count",
                Number(match[1].replace(/,/g, "")),
                "cells/μL",
                `${match[3]} - ${match[4]} cells/μL`
            ));
        }

        console.log("Tests detected:", results.length);

        if (results.length === 0) {
            return res.status(400).json({
                message: "PDF was read successfully, but no supported test results were found.",
                extractedText: normalizedText
            });
        }

        return res.status(200).json({
            message: "Medical report analyzed successfully!",
            results
        });

    } catch (error) {
        console.error("PDF analysis error:", error);

        return res.status(500).json({
            message: "Unable to analyze the medical report.",
            error: error.message
        });
    } finally {
        if (filePath && fs.existsSync(filePath)) {
            try {
                fs.unlinkSync(filePath);
            } catch (error) {
                console.error("Could not delete temporary file:", error.message);
            }
        }
    }
});

// Telugu text-to-speech endpoint
app.get("/tts", async (req, res) => {
    try {
        const text = req.query.text;

        if (!text || !text.trim()) {
            return res.status(400).send("No text provided.");
        }

        const sentences = text.match(/[^.!?।]+[.!?।]?/g) || [text];
        const audioBuffers = [];

        for (const sentence of sentences) {
            const part = sentence.trim();
            if (!part) continue;

            const url =
                "https://translate.googleapis.com/translate_tts" +
                "?client=gtx&ie=UTF-8&tl=te&q=" +
                encodeURIComponent(part);

            const response = await fetch(url, {
                headers: { "User-Agent": "Mozilla/5.0" }
            });

            if (!response.ok) {
                throw new Error("Telugu voice service returned " + response.status);
            }

            audioBuffers.push(Buffer.from(await response.arrayBuffer()));
        }

        if (audioBuffers.length === 0) {
            return res.status(500).send("No Telugu audio was generated.");
        }

        const audio = Buffer.concat(audioBuffers);
        res.setHeader("Content-Type", "audio/mpeg");
        res.setHeader("Cache-Control", "no-cache");
        return res.send(audio);

    } catch (error) {
        console.error("Telugu TTS error:", error.message);
        return res.status(500).send("Unable to generate Telugu voice.");
    }
});

// Handle upload errors
app.use((error, req, res, next) => {
    console.error("Server error:", error.message);
    res.status(400).json({
        message: error.message || "Something went wrong."
    });
});

// Start backend
app.listen(PORT, () => {
    console.log("=================================");
    console.log("MediClarity Backend Started");
    console.log(`Server: http://localhost:${PORT}`);
    console.log(`Upload API: http://localhost:${PORT}/upload`);
    console.log(`Telugu TTS API: http://localhost:${PORT}/tts`);
    console.log("Keep this terminal open.");
    console.log("=================================");
});
