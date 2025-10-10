const sql = require("mssql");
const { BlobServiceClient } = require("@azure/storage-blob");
const { v4: uuidv4 } = require("uuid");

const blobConnectionString = process.env.BLOB_CONNECTION_STRING;
const containerName = process.env.BLOB_CONTAINER_NAME;

module.exports = async function (context, req) {
  try {
    // Use userEmail from front-end
    const { userEmail, subjects, availability } = req.body;

    if (!userEmail || !subjects || !availability) {
      context.res = { 
        status: 400, 
        body: { error: "Email, subjects, and availability are required" } 
      };
      return;
    }

    const email = userEmail; // for SQL queries

    // Connect to SQL
    const pool = await sql.connect({
      user: process.env.SQL_USER,
      password: process.env.SQL_PASSWORD,
      server: process.env.SQL_SERVER,
      database: process.env.SQL_DATABASE,
      options: { encrypt: true },
    });

    // Get user_id from email
    const userResult = await pool.request()
      .input("email", sql.NVarChar, email)
      .query("SELECT id FROM AppUser WHERE email=@email");

    if (userResult.recordset.length === 0) {
      context.res = { status: 400, body: { error: "User not found" } };
      return;
    }

    const userId = userResult.recordset[0].id;

    // Initialize Blob client
    const blobServiceClient = BlobServiceClient.fromConnectionString(blobConnectionString);
    const containerClient = blobServiceClient.getContainerClient(containerName);
    if (!(await containerClient.exists())) {
      await containerClient.create();
    }

    // Insert subjects and upload notes
    for (let subject of subjects) {
      let notesUrl = null;

      // Handle file upload (if provided as base64 string)
      if (subject.notesBase64) {
        const buffer = Buffer.from(subject.notesBase64, "base64");
        const blobName = `${uuidv4()}-${subject.name}.pdf`; // adjust extension if needed
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);
        await blockBlobClient.uploadData(buffer);
        notesUrl = blockBlobClient.url;
      }

      await pool.request()
        .input("user_id", sql.Int, userId)
        .input("name", sql.NVarChar, subject.name)
        .input("exam_date", sql.Date, subject.examDate)
        .input("priority", sql.NVarChar, subject.priority)
        .input("notes_url", sql.NVarChar, notesUrl)
        .query(
          "INSERT INTO UserSubjects (user_id, name, exam_date, priority, notesUrl) VALUES (@user_id, @name, @exam_date, @priority, @notes_url)"
        );
    }

    // Insert availability
    await pool.request()
      .input("user_id", sql.Int, userId)
      .input("weekdays_hours", sql.Int, availability.weekdays)
      .input("weekends_hours", sql.Int, availability.weekends)
      .input("exceptions", sql.NVarChar, availability.exceptions.join(","))
      .query(
        "INSERT INTO UserAvailability (user_id, weekdays_hours, weekends_hours, exceptions) VALUES (@user_id, @weekdays_hours, @weekends_hours, @exceptions)"
      );

    context.res = { status: 200, body: { message: "Plan input submitted successfully!" } };
  } catch (err) {
    context.log.error("SubmitPlanInput error:", err);
    context.res = { status: 500, body: { error: "Server error", details: err.message } };
  }
};
