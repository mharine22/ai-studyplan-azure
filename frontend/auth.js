// --- API Base URL (from env.js) ---
const API_BASE = window.__env.API_BASE;

// --- Signup ---
async function signup() {
  const name = document.getElementById("signupName").value.trim();
  const email = document.getElementById("signupEmail").value.trim();
  const password = document.getElementById("signupPassword").value.trim();
  const messageEl = document.getElementById("message");

  if (!name || !email || !password) {
    messageEl.innerText = "Please fill all fields.";
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (res.ok) {
      alert("Signup successful!");
      window.location.href = "form.html";
    } else {
      messageEl.innerText = data.error || "Signup failed!";
    }
  } catch (err) {
    messageEl.innerText = "Server error: " + err.message;
  }
}

// --- Login ---
async function login() {
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value.trim();
  const messageEl = document.getElementById("message");

  if (!email || !password) {
    messageEl.innerText = "Please enter email and password.";
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (res.ok) {
      localStorage.setItem("userEmail", email);
      window.location.href = "form.html";
    } else {
      messageEl.innerText = data.error || "Login failed!";
    }
  } catch (err) {
    messageEl.innerText = "Server error: " + err.message;
  }
}
