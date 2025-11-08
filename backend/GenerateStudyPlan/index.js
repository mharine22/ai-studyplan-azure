const sql = require("mssql");
// FIX: Using the correct, modern package name installed in package.json
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize the SDK instance correctly by explicitly passing the API Key.
const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// CRITICAL FIX FOR EMPTY RESPONSE: Switching to the more powerful PRO model 
const MODEL = "gemini-2.5-pro";

// Get the Generative Model client once for reuse
const modelClient = ai.getGenerativeModel({ model: MODEL });

module.exports = async function (context, req) {
  try {
    // --- Input Validation and Logging ---
    const { userEmail } = req.body;

    if (!userEmail) {
      context.res = {
        status: 400,
        body: { error: "User email is required for plan generation." }
      };
      return;
    }

    context.log.info(`--- Starting GenerateStudyPlan ---`);
    context.log.info(`Attempting to generate plan for user: ${userEmail}`);

    // Defensive fix for case-sensitive lookups (kept for robustness)
    const normalizedEmail = userEmail.toLowerCase();

    // --- Database Connection ---
    const pool = await sql.connect({
      user: process.env.SQL_USER,
      password: process.env.SQL_PASSWORD,
      server: process.env.SQL_SERVER,
      database: process.env.SQL_DATABASE,
      options: { encrypt: true },
    });
    context.log.info("SQL Connection established successfully.");

    // --- Get User ID ---
    const userResult = await pool.request()
      .input("email", sql.NVarChar, normalizedEmail)
      .query("SELECT id FROM AppUser WHERE email=@email");

    if (userResult.recordset.length === 0) {
      context.res = {
        status: 404,
        body: { error: `User not found in AppUser table for email: ${userEmail}` }
      };
      return;
    }

    const userId = userResult.recordset[0].id;
    context.log.info(`User ID fetched: ${userId}`);

    // --- Fetch User Data (Subjects & Availability) ---
    const subjectsResult = await pool.request()
      .input("user_id", sql.Int, userId)
      .query("SELECT name, exam_date, priority, notesUrl FROM UserSubjects WHERE user_id=@user_id");

    const subjects = subjectsResult.recordset;
    context.log.info(`Fetched ${subjects.length} subjects.`);

    const availabilityResult = await pool.request()
      .input("user_id", sql.Int, userId)
      .query("SELECT weekdays_hours, weekends_hours, exceptions FROM UserAvailability WHERE user_id=@user_id");

    const availability = availabilityResult.recordset[0];
    context.log.info(`Fetched availability: ${JSON.stringify(availability)}`);

    if (subjects.length === 0 || !availability) {
      context.res = {
        status: 404,
        body: { error: "No subjects or availability found for this user." }
      };
      return;
    }

    // --- Construct Prompt for Gemini ---
    let subjectsList = subjects.map(s => {
      let examDateStr = s.exam_date
        ? new Date(s.exam_date).toISOString().split('T')[0]
        : 'N/A';
      let notes = s.notesUrl ? ` (Notes uploaded at: ${s.notesUrl})` : '';
      return `- Subject: ${s.name}, Exam Date: ${examDateStr}, Priority: ${s.priority}${notes}`;
    }).join('\n');

    const prompt = `
      You are an expert AI Study Planner. Your primary goal is to successfully generate a rigorous, yet realistic 7-day study schedule.
      
      Based on the following user data, generate a comprehensive 7-day study plan, starting today. The plan must be delivered as a well-formatted **Markdown** document, using clear headings and lists. Prioritize successfully generating the schedule over excessively rigid table formatting.

      **User Constraints:**
      1. **Total Subjects:** ${subjects.length}
      2. **Available Time:** ${availability.weekdays_hours} hours per weekday, ${availability.weekends_hours} hours per weekend day.
      3. **Time Off/Exceptions:** The user has requested time off or specific exceptions on the following dates: ${availability.exceptions}.

      **Subjects and Priorities:**
      ${subjectsList}

      **Plan Requirements (Use Headings and Lists for Stability):**

      ## Weekly Study Plan Overview
      (Include a brief summary of total planned hours and the distribution of time across all subjects based on priority and exam proximity.)

      ---

      ## Detailed 7-Day Timetable

      * For each Day (Day 1, Day 2, etc.), use an H3 heading (e.g., **### Day 1: Monday**).
      * Under each day, use a Markdown list to detail study sessions.
      * Each list item MUST clearly state: **Time Block, Subject, Topic/Action, and Duration**.
      * Allocation must prioritize High priority subjects and closer exam dates.
      * Do not include any introductory or concluding text outside of this final Markdown schedule.
    `;
    context.log.info("Prompt constructed. Calling Gemini API...");

    // --- Call Gemini API ---
    const response = await modelClient.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      tools: [{ "google_search": {} }],
      generationConfig: { temperature: 0.7 }
    });

    context.log.info("Gemini API call succeeded.");

    // --- CRITICAL FIX: Robustly extract the text from the nested response object ---
    const apiResult = response.response || response;
    const candidate = apiResult.candidates?.[0];
    const generatedPlan = candidate?.content?.parts?.[0]?.text;

    // --- CRITICAL CHECK: Ensure generatedPlan is not empty ---
    if (!generatedPlan || generatedPlan.trim() === "") {
      context.log.error(`CRITICAL: ${MODEL} returned an empty response, even with robust extraction. Response Structure: ${JSON.stringify(apiResult)}`);
      context.res = {
        status: 503,
        body: { error: "AI Generation Failed: The model returned an empty study plan. This is a critical failure. Please simplify your input subjects drastically or try again." }
      };
      return;
    }

    // --- Success Response ---
    context.res = {
      status: 200,
      body: { plan: generatedPlan }
    };

  } catch (err) {
    // --- Error Handling ---
    context.log.error("GenerateStudyPlan CRASHED. Full error details:", err.message, err.stack);
    context.res = {
      status: 500,
      body: { error: "Server error during AI generation.", details: err.message }
    };
  }
};
