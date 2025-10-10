// --- Tab Switching ---
const loginTab = document.getElementById("loginTab");
const signupTab = document.getElementById("signupTab");

const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");
const forgotForm = document.getElementById("forgotForm");

const message = document.getElementById("message");

loginTab.addEventListener("click", () => switchForm("login"));
signupTab.addEventListener("click", () => switchForm("signup"));

function switchForm(form) {
    loginForm.classList.remove("active");
    signupForm.classList.remove("active");
    forgotForm.classList.remove("active");
    loginTab.classList.remove("active");
    signupTab.classList.remove("active");

    if (form === "login") {
        loginForm.classList.add("active");
        loginTab.classList.add("active");
    } else if (form === "signup") {
        signupForm.classList.add("active");
        signupTab.classList.add("active");
    }
}

// --- Forgot Password Flow ---
document.getElementById("forgotPasswordLink").addEventListener("click", e => {
    e.preventDefault();
    loginForm.classList.remove("active");
    signupForm.classList.remove("active");
    forgotForm.classList.add("active");
});

document.getElementById("backToLogin").addEventListener("click", e => {
    e.preventDefault();
    switchForm("login");
});

// --- Signup ---
signupForm.addEventListener("submit", e => {
    e.preventDefault();
    const name = document.getElementById("signupName").value.trim();
    const email = document.getElementById("signupEmail").value.trim();
    const password = document.getElementById("signupPassword").value.trim();

    const users = JSON.parse(localStorage.getItem("users") || "[]");
    if (users.some(u => u.email === email)) {
        alert("Email already registered. Try logging in!");
        return;
    }

    users.push({ name, email, password });
    localStorage.setItem("users", JSON.stringify(users));
    alert("Signup successful! Please login.");
    switchForm("login");
});

// --- Login ---
loginForm.addEventListener("submit", e => {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value.trim();

    const users = JSON.parse(localStorage.getItem("users") || "[]");
    const user = users.find(u => u.email === email && u.password === password);

    if (user) {
        localStorage.setItem("userEmail", user.email);
        window.location.href = "form.html"; // redirect to study planner form
    } else {
        alert("Invalid email or password!");
    }
});

// --- Forgot Password ---
forgotForm.addEventListener("submit", e => {
    e.preventDefault();
    const email = document.getElementById("forgotEmail").value.trim();
    const users = JSON.parse(localStorage.getItem("users") || "[]");
    const user = users.find(u => u.email === email);

    if (user) {
        alert(`Password reset link sent to ${email} (mock)`);
        switchForm("login");
    } else {
        alert("Email not found!");
    }
});
