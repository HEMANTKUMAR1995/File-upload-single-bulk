// require("dotenv").config();
// const express = require("express");
// const multer = require("multer");
// const cors = require("cors");
// const { BlobServiceClient } = require("@azure/storage-blob");

// const app = express();
// const PORT = 5000;
// const upload = multer();
// app.use(cors());

// const blobServiceClient = BlobServiceClient.fromConnectionString(
//   process.env.AZURE_STORAGE_CONNECTION_STRING
// );

// // Utility to sanitize strings (for container names and metadata)
// const sanitize = (str) => str.toLowerCase().replace(/\s+/g, "-");

// const getSanitizedContainerName = (location) => sanitize(location);

// async function createContainerIfNotExists(location) {
//   const containerName = getSanitizedContainerName(location);
//   const containerClient = blobServiceClient.getContainerClient(containerName);
//   const exists = await containerClient.exists();
//   if (!exists) await containerClient.create();
//   return containerClient;
// }

// app.get("/", (req, res) => res.send("Hello World"));

// // Upload API
// app.post("/upload", upload.single("file"), async (req, res) => {
//   try {
//     const { doctorId, specialty, location, documentType } = req.body;
//     const file = req.file;

//     if (!location) {
//       return res.status(400).json({ error: "Location is required." });
//     }
//     if (!doctorId || !specialty || !documentType || !file) {
//       return res.status(400).json({ error: "Missing required fields." });
//     }

//     // Sanitize inputs
//     const sanitizedLocation = sanitize(location);
//     const sanitizedSpecialty = sanitize(specialty);
//     const sanitizedDocumentType = sanitize(documentType);

//     const containerClient = await createContainerIfNotExists(sanitizedLocation);

//     const blobName = `${doctorId}/${sanitizedDocumentType}/${file.originalname}`;
//     const blockBlobClient = containerClient.getBlockBlobClient(blobName);

//     await blockBlobClient.uploadData(file.buffer, {
//       metadata: {
//         doctorid: doctorId.toString(),
//         specialty: sanitizedSpecialty,
//         location: sanitizedLocation,
//         documenttype: sanitizedDocumentType,
//       },
//     });

//     await blockBlobClient.setTags({
//       specialty: sanitizedSpecialty,
//       location: sanitizedLocation,
//       documenttype: sanitizedDocumentType,
//     });

//     res.status(200).json({ message: "File uploaded and tagged successfully." });
//   } catch (err) {
//     console.error("Upload error:", err.message);
//     res.status(500).json({ error: "Upload failed." });
//   }
// });

// // Filter API
// // THis code is fasters but - filtering solely based on speciality wont be possible
// // app.get("/doctors", async (req, res) => {
// //   try {
// //     let { specialty, location } = req.query;

// //     if (!location) {
// //       return res.status(400).json({ error: "Location query is required." });
// //     }

// //     // Sanitize inputs
// //     const sanitizedLocation = sanitize(location);
// //     const sanitizedSpecialty = specialty ? sanitize(specialty) : null;

// //     const containerClient =
// //       blobServiceClient.getContainerClient(sanitizedLocation);

// //     let matchingDoctors = [];

// //     for await (const blob of containerClient.listBlobsFlat({
// //       includeMetadata: true,
// //     })) {
// //       const metadata = blob.metadata || {};

// //       const matchesSpecialty =
// //         !sanitizedSpecialty || metadata.specialty === sanitizedSpecialty;
// //       const matchesLocation =
// //         !sanitizedLocation || metadata.location === sanitizedLocation;

// //       if (matchesSpecialty && matchesLocation) {
// //         matchingDoctors.push({
// //           name: blob.name,
// //           doctorId: metadata.doctorid,
// //           specialty: metadata.specialty,
// //           location: metadata.location,
// //           documentType: metadata.documenttype,
// //           url: containerClient.getBlockBlobClient(blob.name).url,
// //         });
// //       }
// //     }

// //     res.json(matchingDoctors);
// //   } catch (err) {
// //     console.error("Error fetching doctors:", err.message);
// //     res.status(500).send("Error fetching doctors");
// //   }
// // });

// app.get("/doctors", async (req, res) => {
//   try {
//     const { specialty, location } = req.query;

//     let matchingDoctors = [];

//     if (location) {
//       // Existing logic: filter inside one container (location)
//       const containerClient = await createContainerIfNotExists(location);

//       for await (const blob of containerClient.listBlobsFlat({
//         includeMetadata: true,
//       })) {
//         const metadata = blob.metadata;

//         const matchesSpecialty =
//           !specialty ||
//           (metadata.specialty &&
//             metadata.specialty === specialty.toLowerCase());
//         const matchesLocation =
//           !location ||
//           (metadata.location && metadata.location === location.toLowerCase());

//         if (matchesSpecialty && matchesLocation) {
//           matchingDoctors.push({
//             name: blob.name,
//             doctorId: metadata.doctorid,
//             specialty: metadata.specialty,
//             location: metadata.location,
//             documentType: metadata.documenttype,
//             url: containerClient.getBlockBlobClient(blob.name).url,
//           });
//         }
//       }
//     } else if (specialty) {
//       // NEW: location NOT provided, specialty provided -> scan all containers
//       for await (const container of blobServiceClient.listContainers()) {
//         const containerClient = blobServiceClient.getContainerClient(
//           container.name
//         );

//         for await (const blob of containerClient.listBlobsFlat({
//           includeMetadata: true,
//         })) {
//           const metadata = blob.metadata;

//           if (
//             metadata.specialty &&
//             metadata.specialty === specialty.toLowerCase()
//           ) {
//             matchingDoctors.push({
//               name: blob.name,
//               doctorId: metadata.doctorid,
//               specialty: metadata.specialty,
//               location: metadata.location,
//               documentType: metadata.documenttype,
//               url: containerClient.getBlockBlobClient(blob.name).url,
//             });
//           }
//         }
//       }
//     } else {
//       // Neither location nor specialty specified -> maybe return error or empty
//       return res
//         .status(400)
//         .json({ error: "At least specialty or location must be specified." });
//     }

//     res.json(matchingDoctors);
//   } catch (err) {
//     console.error("Error fetching doctors:", err.message);
//     res.status(500).send("Error fetching doctors");
//   }
// });

// app.listen(PORT, () => {
//   console.log(`✅ Server running on http://localhost:${PORT}`);
// });

// ------------------With Scalibility ---------------------------
// AZURE_STORAGE_CONNECTION_STRING="DefaultEndpointsProtocol=https;AccountName=useracc01;AccountKey=UUbUmfaq0Mas8gvmTK/M0eL1SL0RbNnPnW25U8T8dxCJKvADsJn6/Hhf1V4bSTQ8e7HiXno8Wdx2+AStubjxtg==;EndpointSuffix=core.windows.net"
// COSMOS_DB_CONNECTION_STRING="AccountEndpoint=https://usersmetadata.documents.azure.com:443/;AccountKey=XIj6RdBdeJfvOVQB6lNAU8DAvmjJ8zYhoI4mH0VGWof2eeJV9FvbKDUVVc90DO4WddmD0J2YmFhaACDbsZABUw==;"
require("dotenv").config();
const express = require("express");
const multer = require("multer");
const cors = require("cors");
const { BlobServiceClient } = require("@azure/storage-blob");
const { CosmosClient } = require("@azure/cosmos");

const app = express();
const PORT = 5000;
const upload = multer();
app.use(cors());

const blobServiceClient = BlobServiceClient.fromConnectionString(
  process.env.AZURE_STORAGE_CONNECTION_STRING
);

const cosmosClient = new CosmosClient(process.env.COSMOS_DB_CONNECTION_STRING);
const databaseId = "DoctorDocumentsDB";
const containerId = "Documents";

let cosmosContainer; // store initialized container here

// Initialize Cosmos DB database and container once at startup
async function initCosmos() {
  const { database } = await cosmosClient.databases.createIfNotExists({
    id: databaseId,
  });

  const { container } = await database.containers.createIfNotExists({
    id: containerId,
    partitionKey: { paths: ["/location"] },
    // **NO throughput specified here!**
  });

  cosmosContainer = container;
  console.log("✅ Cosmos DB initialized.");
}

// Utility to sanitize strings (for container names and metadata)
const sanitize = (str) => str.toLowerCase().replace(/\s+/g, "-");

const getSanitizedContainerName = (location) => sanitize(location);

async function createContainerIfNotExists(location) {
  const containerName = getSanitizedContainerName(location);
  const containerClient = blobServiceClient.getContainerClient(containerName);
  const exists = await containerClient.exists();
  if (!exists) await containerClient.create();
  return containerClient;
}

app.get("/", (req, res) => res.send("Hello World"));

app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const { doctorId, specialty, location, documentType } = req.body;
    const file = req.file;

    if (!file || !doctorId || !specialty || !location || !documentType) {
      return res.status(400).json({ error: "Missing required fields." });
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

    // Store metadata in Cosmos DB (using initialized container)
    await cosmosContainer.items.create({
      id: `${doctorId}-${Date.now()}`, // unique ID
      doctorId,
      specialty: specialty.toLowerCase(),
      location: location.toLowerCase(),
      documentType: documentType.toLowerCase(),
      blobUrl: blockBlobClient.url,
      timestamp: new Date().toISOString(),
    });

    res
      .status(200)
      .json({ message: "File uploaded and metadata indexed successfully." });
  } catch (err) {
    console.error("Upload error:", err.message);
    res.status(500).json({ error: "Upload failed." });
  }
});

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
      // Query Cosmos DB with partition key (location)
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
    } else if (specialty) {
      // Location not provided, specialty provided
      // Query without partition key - potentially inefficient
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
    console.error("Cosmos DB query error:", err.message);
    res.status(500).send("Error fetching doctor records.");
  }
});

// Start server only after Cosmos DB is initialized
initCosmos()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`✅ Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to initialize Cosmos DB:", err.message);
  });
