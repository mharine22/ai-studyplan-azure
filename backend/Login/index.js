const sql = require("mssql");
const bcrypt = require("bcryptjs");

module.exports = async function (context, req) {
  try {
    // ✅ Safe body parsing for Azure
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

    // ✅ Connect to Azure SQL
    const pool = await sql.connect({
      user: process.env.SQL_USER,
      password: process.env.SQL_PASSWORD,
      server: process.env.SQL_SERVER,
      database: process.env.SQL_DATABASE,
      options: { encrypt: true }
    });

    // ✅ Check user exists
    const result = await pool.request()
      .input("email", sql.NVarChar, email.trim())
      .query("SELECT password_hash FROM AppUser WHERE email=@email");

    if (result.recordset.length === 0) {
      context.res = { status: 401, body: { error: "Invalid email or password" } };
      return;
    }

    const valid = bcrypt.compareSync(password, result.recordset[0].password_hash);
    if (!valid) {
      context.res = { status: 401, body: { error: "Invalid email or password" } };
      return;
    }

    // ✅ Successful login
    context.res = {
      status: 200,
      body: { message: "Login successful", email }
    };

  } catch (err) {
    context.log.error("Login error:", err);
    context.res = {
      status: 500,
      body: { error: "Server error", details: err.message }
    };
  }
};
