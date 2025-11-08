// --- API Base URL (from env.js) ---
const API_BASE = window.__env.API_BASE;

// --- Signup Function ---
async function signup() {
  const name = document.getElementById("signupName").value.trim();
  const email = document.getElementById("signupEmail").value.trim();
  const password = document.getElementById("signupPassword").value.trim();
  const message = document.getElementById("message");

  message.innerText = "";

  if (!name || !email || !password) {
    message.innerText = "Please fill all fields.";
    return;
  }

  try {
    const res = await fetch(`${window.API_BASE_URL}/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (res.ok) {
       message.style.color = "green";
      message.innerText = data.message || "Signup successful!";
      setTimeout(() => {
        document.getElementById("loginTab").click();
      }, 1500);
    } else {
      message.style.color = "red";
      message.innerText = data.error || "Signup failed!";
    }
  } catch (err) {
    message.style.color = "red";
    message.innerText = "Error: " + err.message;
  }
}

// --- Login Function ---
async function login() {
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value.trim();
  const message = document.getElementById("message");

  message.innerText = "";

  if (!email || !password) {
    message.innerText = "Please enter email and password.";
    return;
  }

  try {
    const res = await fetch(`${window.env.API_BASE_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (res.ok) {
      message.style.color = "green";
      message.innerText = data.message || "Login successful!";
      localStorage.setItem("userEmail", email);
      setTimeout(() => {
        window.location.href = "form.html"; // redirect after login
      }, 1500);// redirect after login
    } else {
      message.style.color = "red";
      message.innerText = data.error || "Invalid email or password.";
    }
  } catch (err) {
    message.style.color = "red";
    message.innerText = "Server error: " + err.message;
  }
}
