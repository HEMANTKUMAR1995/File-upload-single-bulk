const express = require("express");
const multer = require("multer");
const cors = require("cors");
const { BlobServiceClient } = require("@azure/storage-blob");
const path = require("path");
const fs = require("fs");
const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Azure Blob Setup
const AZURE_STORAGE_CONNECTION_STRING =
const containerName = "mnpractitioner";
const blobServiceClient = BlobServiceClient.fromConnectionString(
  AZURE_STORAGE_CONNECTION_STRING
);
const containerClient = blobServiceClient.getContainerClient(containerName);

// Multer Setup
const upload = multer({ dest: "uploads/" });

// Static classification map
const classificationMap = {
  PAN: { type: "ProfessionalAccount Number", confidence: "99%" },
  Malpractice: { type: "Malpractice Certificate", confidence: "98%" },
  Internship: { type: "Internship Letter", confidence: "97%" },
  DEA: { type: "DEA Certificate", confidence: "96%" },
  CV: { type: "Curriculum Vitae", confidence: "99%" },
  "CG_Gratuity_Form F": { type: "Gratuity Form", confidence: "95%" },
  "CG_Insurance_Nomination Form": { type: "Insurance Form", confidence: "95%" },
  AAdhar: { type: "Photo ID", confidence: "98%" },
};

// Classification logic
async function simulateClassification(blobUrl, originalFileName) {
  await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate delay

  if (!originalFileName) {
    return { type: "Unknown", confidence: "0%", url: blobUrl };
  }

  const match = Object.entries(classificationMap).find(([key]) =>
    originalFileName.toLowerCase().includes(key.toLowerCase())
  );

  if (match) {
    return { ...match[1], url: blobUrl };
  }

  return { type: "Unknown", confidence: "50%", url: blobUrl };
}

// Route: Upload multiple files
app.post("/upload", upload.array("files"), async (req, res) => {
  try {
    const files = req.files;

    const results = await Promise.all(
      files.map(async (file) => {
        const blobName = `${Date.now()}-${file.originalname}`;
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);

        const stream = fs.createReadStream(file.path);
        await blockBlobClient.uploadStream(stream);
        fs.unlinkSync(file.path); // cleanup

        const blobUrl = blockBlobClient.url;
        const classification = await simulateClassification(
          blobUrl,
          file.originalname
        );

        return {
          originalName: file.originalname,
          url: blobUrl,
          classification,
        };
      })
    );

    res.json({ results });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error uploading or classifying files");
  }
});

app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
