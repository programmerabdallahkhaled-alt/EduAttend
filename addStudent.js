import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ===== Firebase Config =====
const firebaseConfig = {
  apiKey: "AIzaSyADeo3Nc2lqGKtnr_UqfNEZB28aGUCQsrc",
  authDomain: "eduattend-90a3d.firebaseapp.com",
  projectId: "eduattend-90a3d",
  storageBucket: "eduattend-90a3d.firebasestorage.app",
  messagingSenderId: "1002840427136",
  appId: "1:1002840427136:web:9de92f16a4303c8f117465"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ===== إضافة طالب =====
document.getElementById("addStudentForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("studentName").value.trim();
  const phone = document.getElementById("studentPhone").value.trim();
  const level = document.getElementById("studentLevel").value;

  if (!name || !phone || !level) {
    alert("الرجاء ملء جميع الحقول");
    return;
  }

  try {
    await addDoc(collection(db, "students"), {
      name,
      phone,
      level: Number(level),
      createdAt: new Date()
    });

    alert("تم إضافة الطالب بنجاح");
    window.location.href = "students.html";

  } catch (err) {
    console.error("Error:", err);
    alert("حدث خطأ أثناء الإضافة");
  }
});

// ===== زر الإلغاء =====
document.getElementById("cancelBtn").addEventListener("click", () => {
  window.location.href = "students.html";
});
