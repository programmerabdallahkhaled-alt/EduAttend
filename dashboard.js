// ===== Firebase Init =====
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, getCountFromServer } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyADeo3Nc2lqGKtnr_UqfNEZB28aGUCQsrc",
  authDomain: "eduattend-90a3d.firebaseapp.com",
  projectId: "eduattend-90a3d",
  storageBucket: "eduattend-90a3d.firebasestorage.app",
  messagingSenderId: "1002840427136",
  appId: "1:1002840427136:web:9de92f16a4303c8f117465"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ===== التأكد من تسجيل الدخول =====
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "index.html";
  } else {
    loadDashboardNumbers();
  }
});

// ===== تسجيل الخروج =====
document.getElementById("logoutBtn").addEventListener("click", async () => {
  await signOut(auth);
});

// ===== تحميل الأرقام (عدد الطلاب + عدد الحصص) =====
async function loadDashboardNumbers() {
  try {
    const studentsSnap = await getCountFromServer(collection(db, "students"));
    const lessonsSnap = await getCountFromServer(collection(db, "lessons"));

    document.getElementById("studentsCount").textContent = studentsSnap.data().count;
    document.getElementById("lessonsCount").textContent = lessonsSnap.data().count;
  } catch (error) {
    console.error("Error fetching counts:", error);
  }
}

// Sidebar navigation links
const gotoDashboard = document.querySelector('#nav-dashboard');
const gotoStudents = document.querySelector('#nav-students');
const gotoLessons = document.querySelector('#nav-lessons');
const gotoAttend = document.querySelector('#nav-attend');

if (gotoDashboard) gotoDashboard.addEventListener('click', () => window.location.href = 'dashboard.html');
if (gotoStudents) gotoStudents.addEventListener('click', () => window.location.href = 'students.html');
if (gotoLessons) gotoLessons.addEventListener('click', () => window.location.href = 'lessons.html');
if (gotoAttend) gotoAttend.addEventListener('click', () => window.location.href = 'attend.html');
