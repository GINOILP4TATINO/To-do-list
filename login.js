import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "https://www.gstatic.com/firebasejs/11.7.3/firebase-auth.js";

import {
  getDatabase,
  ref,
  update,
} from "https://www.gstatic.com/firebasejs/11.7.3/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyBw9_oMxgI1QwMqgkfiIYy0iQ1Lm7O1b7M",
  authDomain: "to-do-list-29fb3.firebaseapp.com",
  projectId: "to-do-list-29fb3",
  storageBucket: "to-do-list-29fb3.firebasestorage.app",
  messagingSenderId: "299539065118",
  appId: "1:299539065118:web:a4214710258d27f552010f",
  measurementId: "G-V8DRJPHY47",
  databaseURL:
    "https://to-do-list-29fb3-default-rtdb.europe-west1.firebasedatabase.app",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

const themeToggle = document.getElementById("themeToggle");
themeToggle.addEventListener("change", () => {
  document.body.classList.toggle("dark", themeToggle.checked);
  localStorage.setItem("theme", themeToggle.checked);
});

const formTitle = document.getElementById("formTitle");
const confirmPasswordContainer = document.getElementById(
  "confirmPasswordContainer"
);
const toggleLink = document.getElementById("toggleLink");
const toggleText = document.getElementById("toggleText");
const authForm = document.getElementById("authForm");
const accessBtn = document.getElementById("accessBtn");

const email = document.getElementById("email");
const pass = document.getElementById("password");
const confirmPass = document.getElementById("confirmPassword");

let isSignup = false;

toggleLink.addEventListener("click", (e) => {
  e.preventDefault();
  isSignup = !isSignup;

  formTitle.textContent = isSignup ? "Registrati" : "Accedi";
  accessBtn.textContent = formTitle.textContent;
  confirmPasswordContainer.style.display = isSignup ? "block" : "none";
  toggleText.innerHTML = isSignup
    ? 'Hai già un account? <a href="#" id="toggleLink">Accedi</a>'
    : 'Non hai un account? <a href="#" id="toggleLink">Registrati</a>';

  // Ricollega il nuovo link dopo innerHTML update
  document
    .getElementById("toggleLink")
    .addEventListener("click", toggleLinkClick);
});

function toggleLinkClick(e) {
  e.preventDefault();
  toggleLink.click();
}

authForm.addEventListener("submit", (e) => {
  e.preventDefault();
  if (isSignup) {
    if (pass.value === confirmPass.value) signUp(auth, email.value, pass.value);
    else alert("Password don't match");
  } else signIn(auth, email.value, pass.value);
});
function signUp(auth, email, pass) {
  createUserWithEmailAndPassword(auth, email, pass)
    .then((userCredential) => {
      // Signed up
      const user = userCredential.user;
      let uid = user.uid;
      localStorage.setItem("firstLog", true);
      localStorage.setItem("uid", uid);
      update(ref(db, "users/" + uid), {
        uid,
        email,
        pass,
      }).then(() => (window.location.href = "home.html"));
    })
    .catch((error) => {
      const errorCode = error.code;
      const errorMessage = error.message;
      alert(errorMessage);
    });
}
function signIn(auth, email, pass) {
  signInWithEmailAndPassword(auth, email, pass)
    .then((userCredential) => {
      // Signed in
      const user = userCredential.user;
      let uid = user.uid;
      localStorage.setItem("uid", uid);
      window.location.href = "home.html";
      // ...
    })
    .catch((error) => {
      const errorCode = error.code;
      const errorMessage = error.message;
      alert(errorMessage);
    });
}
