const { BlobServiceClient } = require("@azure/storage-blob");

module.exports = async function (context, req) {
  try {
    // Expect JSON body: { "fileName": "notes.pdf", "fileContent": "<base64 string>" }
    if (!req.body || !req.body.fileName || !req.body.fileContent) {
      context.res = {
        status: 400,
        body: { error: "Missing fileName or fileContent in request body" }
      };
      return;
    }

    const { fileName, fileContent } = req.body;

    // Decode base64 content to Buffer
    const fileBuffer = Buffer.from(fileContent, "base64");

    // Azure Blob Storage client
    const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.BLOB_CONNECTION_STRING);
    const containerClient = blobServiceClient.getContainerClient(process.env.BLOB_CONTAINER_NAME);
    await containerClient.createIfNotExists();

    const blobName = Date.now() + "-" + fileName;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    // Upload buffer directly
    await blockBlobClient.uploadData(fileBuffer);

    const fileUrl = blockBlobClient.url;

    context.res = { status: 200, body: { fileUrl } };
  } catch (err) {
    context.log.error("UploadNotes error:", err);
    context.res = {
      status: 500,
      body: { error: "File upload failed", details: err.message }
    };
  }
};
