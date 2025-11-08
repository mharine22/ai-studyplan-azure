const loginTab = document.getElementById("loginTab");
const signupTab = document.getElementById("signupTab");
const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");
const forgotForm = document.getElementById("forgotForm");
const message = document.getElementById("message");

loginTab.addEventListener("click", () => {
  loginTab.classList.add("active");
  signupTab.classList.remove("active");
  loginForm.classList.add("active");
  signupForm.classList.remove("active");
  forgotForm.classList.remove("active");
  message.innerText = "";
});

signupTab.addEventListener("click", () => {
  signupTab.classList.add("active");
  loginTab.classList.remove("active");
  signupForm.classList.add("active");
  loginForm.classList.remove("active");
  forgotForm.classList.remove("active");
  message.innerText = "";
});

document.getElementById("backToLogin").addEventListener("click", () => {
  loginTab.click();
});

document.getElementById("forgotSubmit").addEventListener("click", () => {
  const email = document.getElementById("forgotEmail").value.trim();
  if (email) {
    alert(`Password reset link sent to ${email} (mock)`); 
    loginTab.click();
  } else {
    alert("Enter your email first!");
  }
});
