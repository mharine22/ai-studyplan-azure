document.addEventListener("DOMContentLoaded", () => {
  const subjectsDiv = document.getElementById("subjects");
  const addSubjectBtn = document.getElementById("addSubjectBtn");
  const form = document.getElementById("studyForm");
  const messageDiv = document.getElementById("message");

  // Hugging Face environment variables
  const HF_TOKEN = window.__env.HF_TOKEN;
  const HF_MODEL = window.__env.HF_MODEL;

  addSubjectBlock();
  addSubjectBtn.addEventListener("click", addSubjectBlock);

  // Add subject block function
  function addSubjectBlock() {
    const div = document.createElement("div");
    div.classList.add("subject");
    div.innerHTML = `
      <button type="button" class="remove-btn">X</button>
      <label>Subject Name:</label>
      <input type="text" class="subject-name" required />

      <label>Exam Date:</label>
      <input type="date" class="exam-date" required />

      <label>Priority:</label>
      <select class="priority">
        <option value="High">High</option>
        <option value="Medium">Medium</option>
        <option value="Low">Low</option>
      </select>

      <label>Upload Notes (optional):</label>
      <input type="file" class="notes-file" accept=".pdf,.txt,.doc,.docx,.jpg,.png" />
    `;
    div.querySelector(".remove-btn").addEventListener("click", () => div.remove());
    subjectsDiv.appendChild(div);
  }

  // Convert file to Base64
  async function getBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // Hugging Face API call
  async function generateStudyPlan(payload) {
    const prompt = `Generate a detailed study plan for a student based on these subjects and availability:\n${JSON.stringify(payload, null, 2)}`;

    const response = await fetch(`https://api-inference.huggingface.co/models/${HF_MODEL}`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${HF_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ inputs: prompt, options: { wait_for_model: true } })
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error);

    // HF returns generated text
    return data[0].generated_text || data[0].text || "No plan generated";
  }

  // Form submission
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    messageDiv.textContent = "⏳ Generating study plan...";
    messageDiv.style.color = "black";

    try {
      const email = document.getElementById("email").value.trim();
      const weekdays = parseInt(document.getElementById("weekdays").value);
      const weekends = parseInt(document.getElementById("weekends").value);
      const exceptions = document.getElementById("exceptions").value
        ? document.getElementById("exceptions").value.split(",").map(x => x.trim())
        : [];

      const subjects = [];
      for (const block of document.querySelectorAll(".subject")) {
        const name = block.querySelector(".subject-name").value.trim();
        const examDate = block.querySelector(".exam-date").value;
        const priority = block.querySelector(".priority").value;
        const file = block.querySelector(".notes-file").files[0];
        let notesBase64 = file ? await getBase64(file) : null;
        subjects.push({ name, examDate, priority, notesBase64 });
      }

      const payload = { email, subjects, availability: { weekdays, weekends, exceptions } };
      console.log("📦 Payload Sent:", payload);

      // Call HF API
      const studyPlanText = await generateStudyPlan(payload);
      console.log("Generated Study Plan:", studyPlanText);

      // Show result on page
      messageDiv.textContent = "✅ Study Plan Generated!";
      messageDiv.style.color = "green";
      const planDiv = document.getElementById("generatedPlan") || document.createElement("pre");
      planDiv.id = "generatedPlan";
      planDiv.textContent = studyPlanText;
      document.body.appendChild(planDiv);

    } catch (err) {
      console.error("Error generating study plan:", err);
      messageDiv.textContent = "❌ Error generating study plan.";
      messageDiv.style.color = "red";
    }
  });
});
