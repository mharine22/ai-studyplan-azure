document.addEventListener("DOMContentLoaded", () => {
  const subjectsDiv = document.getElementById("subjects");
  const addSubjectBtn = document.getElementById("addSubjectBtn");
  const form = document.getElementById("studyForm");
  const messageDiv = document.getElementById("message");
  const viewPlanBtn = document.getElementById("viewPlanBtn");
  const submitBtn = document.getElementById("submitBtn");

  const FUNCTION_APP_URL =
    window.FUNCTION_APP_URL ||
    "https://func-ai-studyplan-bggxb5cfafd7fbc6.centralindia-01.azurewebsites.net/api";

  if (subjectsDiv.children.length === 0) addSubjectBlock();

  addSubjectBtn.addEventListener("click", addSubjectBlock);
  form.addEventListener("submit", handleSubmit);
  viewPlanBtn.addEventListener("click", () => {
    window.location.href = "study_plan.html";
  });

  function addSubjectBlock() {
    const div = document.createElement("div");
    div.classList.add(
      "subject",
      "border",
      "border-gray-200",
      "p-4",
      "rounded-lg",
      "bg-gray-50",
      "shadow-md",
      "relative",
      "mt-4"
    );

    div.innerHTML = `
      <button type="button" class="remove-btn absolute top-3 right-3 p-1.5 bg-red-500 text-white rounded-full text-xs hover:bg-red-600 transition">X</button>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="block mb-1 font-semibold text-gray-700">Subject Name:</label>
          <input type="text" class="subject-name w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition" required />
        </div>
        <div>
          <label class="block mb-1 font-semibold text-gray-700">Exam Date:</label>
          <input type="date" class="exam-date w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition" required />
        </div>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
        <div>
          <label class="block mb-1 font-semibold text-gray-700">Priority:</label>
          <select class="priority w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition">
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
        <div>
          <label class="block mb-1 font-semibold text-gray-700">Upload Notes (optional):</label>
          <input type="file" class="notes-file w-full p-2 bg-white border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition file:mr-4 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" accept=".pdf,.txt,.doc,.docx,.jpg,.png" />
        </div>
      </div>
    `;

    div.querySelector(".remove-btn").addEventListener("click", (e) => {
      e.preventDefault();
      div.remove();
    });

    subjectsDiv.appendChild(div);
  }

  function getBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function callAzureFunction(endpoint, payload) {
    const url = `${FUNCTION_APP_URL}/${endpoint}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      let errMsg = response.statusText;
      try {
        const errBody = await response.json();
        errMsg = errBody.error || errBody.message || errMsg;
      } catch {}
      throw new Error(`API call to /${endpoint} failed: ${errMsg}`);
    }

    return response.json();
  }

  async function handleSubmit(e) {
    e.preventDefault();

    submitBtn.disabled = true;
    submitBtn.textContent = "Generating... Please wait";
    messageDiv.textContent = "⏳ Processing your data...";
    messageDiv.className = "text-gray-900 font-bold";
    viewPlanBtn.style.display = "none";

    try {
      const userEmail = document.getElementById("email").value.trim();
      const weekdays = parseInt(document.getElementById("weekdays").value);
      const weekends = parseInt(document.getElementById("weekends").value);
      const exceptions = document
        .getElementById("exceptions")
        .value.split(",")
        .map((x) => x.trim())
        .filter(Boolean);

      const subjects = [];
      const subjectBlocks = document.querySelectorAll(".subject");

      for (const block of subjectBlocks) {
        const name = block.querySelector(".subject-name").value.trim();
        const examDate = block.querySelector(".exam-date").value;
        const priority = block.querySelector(".priority").value;
        const file = block.querySelector(".notes-file").files[0];

        let notesBase64 = null;
        if (file) {
          messageDiv.textContent = `📚 Reading notes for ${name}...`;
          notesBase64 = await getBase64(file);
        }

        subjects.push({ name, examDate, priority, notesBase64 });
      }

      const payload = {
        userEmail,
        subjects,
        availability: { weekdays, weekends, exceptions },
      };

      messageDiv.textContent = "✅ Submitting data to Azure...";
      await callAzureFunction("SubmitPlanInput", payload);

      messageDiv.textContent = "✨ Generating AI Study Plan...";
      const planResult = await callAzureFunction("GenerateStudyPlan", payload);

      const studyPlanText =
        planResult.plan || "Plan generation succeeded, but returned empty.";
    localStorage.setItem(
  "generatedStudyPlan",
  JSON.stringify({ plan: studyPlanText, studyPlanText })
);

      messageDiv.textContent = "🎉 Study Plan Generated Successfully!";
      messageDiv.className = "text-green-600 font-bold";

      // ✅ Re-enable button
      submitBtn.disabled = false;
      submitBtn.textContent = "✨ Generate AI Plan";

      // ✅ Show "View Plan" button
      viewPlanBtn.style.display = "inline-block";
    } catch (err) {
      console.error(err);
      messageDiv.textContent = `❌ ERROR: ${err.message}`;
      messageDiv.className = "text-red-600 font-bold";
      submitBtn.disabled = false;
      submitBtn.textContent = "✨ Generate AI Plan";
    }
  }
});
