require("dotenv").config();
const express = require("express");
const multer = require("multer");
const cors = require("cors");
const { CosmosClient } = require("@azure/cosmos");
const {
  BlobServiceClient,
  StorageSharedKeyCredential,
  generateBlobSASQueryParameters,
  SASProtocol,
  BlobSASPermissions,
} = require("@azure/storage-blob");

const app = express();
const PORT = 5000;
const upload = multer();
app.use(cors());

const allowedTypes = ["pdf", "docx", "xlsx", "png", "jpg", "jpeg"];
const blobServiceClient = BlobServiceClient.fromConnectionString(
  process.env.AZURE_STORAGE_CONNECTION_STRING
);
const cosmosClient = new CosmosClient(process.env.COSMOS_DB_CONNECTION_STRING);

const databaseId = "DoctorDocumentsDB";
const containerId = "Documents";

let cosmosContainer;

async function initCosmos() {
  const { database } = await cosmosClient.databases.createIfNotExists({
    id: databaseId,
  });
  const { container } = await database.containers.createIfNotExists({
    id: containerId,
    partitionKey: { paths: ["/location"] },
  });
  cosmosContainer = container;
  console.log("✅ Cosmos DB initialized.");
}

const sanitize = (str) => str.toLowerCase().replace(/\s+/g, "-");
const getSanitizedContainerName = (location) => sanitize(location);

// Create container if not exists
async function createContainerIfNotExists(location) {
  const containerName = getSanitizedContainerName(location);
  const containerClient = blobServiceClient.getContainerClient(containerName);
  const exists = await containerClient.exists();
  if (!exists) {
    await containerClient.create({ access: "private" });
  }
  return containerClient;
}

// Setup SAS token generation
const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;

const sharedKeyCredential = new StorageSharedKeyCredential(
  accountName,
  accountKey
);

// Endpoint: Upload File
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const { doctorId, specialty, location, documentType } = req.body;
    const file = req.file;

    if (!file || !doctorId || !specialty || !location || !documentType) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    const ext = file.originalname.split(".").pop().toLowerCase();
    if (!allowedTypes.includes(ext)) {
      return res.status(400).json({ error: "Unsupported file type." });
    }

    const containerClient = await createContainerIfNotExists(location);
    const blobName = `${doctorId}/${documentType}/${file.originalname}`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    await blockBlobClient.uploadData(file.buffer, {
      metadata: {
        doctorid: doctorId,
        specialty: specialty.toLowerCase(),
        location: location.toLowerCase(),
        documenttype: documentType.toLowerCase(),
      },
    });

    await blockBlobClient.setTags({
      specialty: specialty.toLowerCase(),
      location: location.toLowerCase(),
      documenttype: documentType.toLowerCase(),
    });

    // Save in Cosmos DB
    await cosmosContainer.items.create({
      id: `${doctorId}-${Date.now()}`,
      doctorId,
      specialty: specialty.toLowerCase(),
      location: location.toLowerCase(),
      documentType: documentType.toLowerCase(),
      fileName: file.originalname,
      blobPath: blobName,
      timestamp: new Date().toISOString(),
    });

    res.status(200).json({ message: "File uploaded successfully." });
  } catch (err) {
    console.error("Upload error:", err.message);
    res.status(500).json({ error: "Upload failed." });
  }
});

// Endpoint: Get SAS URL
app.get("/get-url", async (req, res) => {
  try {
    const { location, doctorId, documentType, fileName } = req.query;

    if (!location || !doctorId || !documentType || !fileName) {
      return res.status(400).json({ error: "Missing required query params." });
    }

    const containerName = getSanitizedContainerName(location);
    const blobName = `${doctorId}/${documentType}/${fileName}`;

    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blobClient = containerClient.getBlobClient(blobName);

    const expiresOn = new Date(new Date().valueOf() + 3600 * 1000); // 1 hour

    // Determine content type based on file extension (simple check)
    let contentType = "application/octet-stream";
    if (fileName.toLowerCase().endsWith(".pdf"))
      contentType = "application/pdf";
    else if (
      fileName.toLowerCase().endsWith(".jpg") ||
      fileName.toLowerCase().endsWith(".jpeg")
    )
      contentType = "image/jpeg";
    else if (fileName.toLowerCase().endsWith(".png")) contentType = "image/png";
    // Add more types as needed

    // Generate SAS token with content disposition and content type to force inline display
    const sasToken = generateBlobSASQueryParameters(
      {
        containerName,
        blobName,
        permissions: BlobSASPermissions.parse("r"),
        startsOn: new Date(),
        expiresOn,
        protocol: SASProtocol.Https,
        contentDisposition: `inline; filename="${fileName}"`,
        contentType: contentType,
      },
      sharedKeyCredential
    ).toString();

    const sasUrl = `${blobClient.url}?${sasToken}`;
    res.json({ sasUrl });
  } catch (err) {
    console.error("SAS error:", err.message);
    res.status(500).json({ error: "Failed to generate SAS URL." });
  }
});

// Endpoint: Filter docs
app.get("/doctors", async (req, res) => {
  try {
    const { specialty, location } = req.query;
    if (!specialty && !location) {
      return res
        .status(400)
        .json({ error: "At least specialty or location must be specified." });
    }

    let results = [];
    if (location) {
      let query = `SELECT * FROM c WHERE c.location = @location`;
      let parameters = [{ name: "@location", value: location.toLowerCase() }];
      if (specialty) {
        query += ` AND c.specialty = @specialty`;
        parameters.push({ name: "@specialty", value: specialty.toLowerCase() });
      }
      const { resources } = await cosmosContainer.items
        .query({ query, parameters }, { partitionKey: location.toLowerCase() })
        .fetchAll();
      results = resources;
    } else {
      const query = `SELECT * FROM c WHERE c.specialty = @specialty`;
      const parameters = [
        { name: "@specialty", value: specialty.toLowerCase() },
      ];
      const { resources } = await cosmosContainer.items
        .query({ query, parameters })
        .fetchAll();
      results = resources;
    }

    res.json(results);
  } catch (err) {
    console.error("Query error:", err.message);
    res.status(500).send("Error fetching doctor records.");
  }
});

app.get("/", (req, res) => res.send("Hello World"));

initCosmos().then(() => {
  app.listen(PORT, () => {
    console.log(`✅ Server running at http://localhost:${PORT}`);
  });
});
