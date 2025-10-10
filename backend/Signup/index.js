const sql = require("mssql");
const bcrypt = require("bcryptjs");

module.exports = async function (context, req) {
  try {
    // ✅ Safe JSON parsing
    let body = {};
    if (typeof req.body === "string") {
      body = JSON.parse(req.body);
    } else {
      body = req.body || {};
    }

    const { email, password } = body;

    if (!email || !password) {
      context.res = { status: 400, body: { error: "Email and password are required" } };
      return;
    }

    const password_hash = bcrypt.hashSync(password, 10);

    const pool = await sql.connect({
      user: process.env.SQL_USER,
      password: process.env.SQL_PASSWORD,
      server: process.env.SQL_SERVER,
      database: process.env.SQL_DATABASE,
      options: { encrypt: true }
    });

    // ✅ Check existing user
    const existing = await pool.request()
      .input("email", sql.NVarChar, email)
      .query("SELECT id FROM AppUser WHERE email=@email");

    if (existing.recordset.length > 0) {
      context.res = { status: 400, body: { error: "User already exists" } };
      return;
    }

    // ✅ Insert new user
    await pool.request()
      .input("email", sql.NVarChar, email)
      .input("password_hash", sql.NVarChar, password_hash)
      .query("INSERT INTO AppUser (email, password_hash) VALUES (@email, @password_hash)");

    context.res = {
      status: 200,
      body: { message: "Signup successful", email }
    };

  } catch (err) {
    context.log.error("Signup error:", err);
    context.res = {
      status: 500,
      body: { error: "Server error", details: err.message }
    };
  }
};
