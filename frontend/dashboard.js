const API_BASE = window.__env.API_BASE;
const planContainer = document.getElementById("planContainer");
const messageEl = document.getElementById("message");
const userEmail = localStorage.getItem("userEmail") || "testuser@example.com";

async function fetchPlan() {
  messageEl.innerText = "Loading your AI study plan...";
  try {
    const res = await fetch(`${API_BASE}/generate-plan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userEmail })
    });
    const data = await res.json();
    renderPlan(data.plan);
    messageEl.innerText = "";
  } catch (err) {
    messageEl.innerText = "Error loading plan: " + err.message;
  }
}

function renderPlan(plan) {
  planContainer.innerHTML = "";
  const grouped = {};
  plan.forEach(session => {
    if (!grouped[session.date]) grouped[session.date] = [];
    grouped[session.date].push(session);
  });

  for (const [date, sessions] of Object.entries(grouped)) {
    const dayCard = document.createElement("div");
    dayCard.className = "day-card";
    const dateObj = new Date(date);
    dayCard.innerHTML = `<h3>${dateObj.toDateString()}</h3>`;
    sessions.forEach(s => {
      const sessionEl = document.createElement("div");
      sessionEl.className = `session ${s.priority.toLowerCase()}`;
      sessionEl.innerHTML = `<span>${s.time} → ${s.subject}: ${s.topic}</span>`;
      dayCard.appendChild(sessionEl);
    });
    planContainer.appendChild(dayCard);
  }
}

document.getElementById("regeneratePlan").addEventListener("click", fetchPlan);
document.getElementById("downloadPlan").addEventListener("click", () => {
  const rows = [["Date","Time","Subject","Topic","Priority"]];
  const sessionDivs = document.querySelectorAll(".session");
  sessionDivs.forEach(div => {
    const text = div.innerText.split(" → ");
    const time = text[0];
    const [subject, topic] = text[1].split(": ");
    const priority = div.classList.contains("high") ? "High" : div.classList.contains("medium") ? "Medium" : "Low";
    const date = div.closest(".day-card").querySelector("h3").innerText;
    rows.push([date, time, subject, topic, priority]);
  });
  let csvContent = "data:text/csv;charset=utf-8," + rows.map(r => r.join(",")).join("\n");
  const link = document.createElement("a");
  link.setAttribute("href", encodeURI(csvContent));
  link.setAttribute("download", "AI_Study_Plan.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});

// Initial fetch
fetchPlan();
