/* =============================
   lessons.js - إدارة الحصص
   متصل بـ Firebase Firestore
   ============================= */

// -------------------------------
// Firebase Configuration
// -------------------------------
const firebaseConfig = {
  apiKey: "AIzaSyADeo3Nc2lqGKtnr_UqfNEZB28aGUCQsrc",
  authDomain: "eduattend-90a3d.firebaseapp.com",
  projectId: "eduattend-90a3d",
  storageBucket: "eduattend-90a3d.firebasestorage.app",
  messagingSenderId: "1002840427136",
  appId: "1:1002840427136:web:9de92f16a4303c8f117465"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// ===== زر إضافة حصة =====
document.getElementById("addLessonBtn").addEventListener("click", () => {
  window.location.href = "addLesson.html";  
});


// -------------------------------
// حماية الصفحة
// -------------------------------
auth.onAuthStateChanged((user) => {
  if (!user) location.href = "index.html";
});

import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const auth = getAuth();

document.getElementById("logoutBtn").addEventListener("click", async () => {
  try {
    await signOut(auth);
    window.location.href = "login.html";
  } catch (error) {
    console.log("Logout Error:", error);
  }
});

});



// -------------------------------
// عناصر DOM
// -------------------------------
const addLessonBtn = document.getElementById("addLessonBtn");
const lessonModal = document.getElementById("lessonModal");
const closeModal = document.getElementById("closeModal");
const saveLesson = document.getElementById("saveLesson");

const modalTitle = document.getElementById("modalTitle");
const lessonTitle = document.getElementById("lessonTitle");
const lessonDate = document.getElementById("lessonDate");
const lessonLevel = document.getElementById("lessonLevel");
const lessonsTable = document.getElementById("lessonsTable");

let editID = null; // في حالة التعديل

// -------------------------------
// فتح و إغلاق المودال
// -------------------------------
addLessonBtn.onclick = () => {
  modalTitle.textContent = "إضافة حصة";
  editID = null;
  lessonTitle.value = "";
  lessonDate.value = "";
  lessonLevel.value = "1";
  lessonModal.style.display = "flex";
};

closeModal.onclick = () => {
  lessonModal.style.display = "none";
};

// -------------------------------
// توليد مفتاح الحصة lesson_ + 11 رقم
// -------------------------------
function generateLessonKey() {
  let r = Math.floor(Math.random() * 10 ** 11).toString().padStart(11, "0");
  return "lesson_" + r;
}

// -------------------------------
// حفظ أو تعديل الحصة
// -------------------------------
saveLesson.onclick = async () => {
  const title = lessonTitle.value.trim();
  const date = lessonDate.value;
  const level = lessonLevel.value;

  if (!title || !date) {
    alert("يرجى ملء جميع البيانات");
    return;
  }

  if (editID) {
    // تعديل
    await db.collection("lessons").doc(editID).update({
      title,
      date,
      level,
    });
  } else {
    // إضافة جديدة
    const key = generateLessonKey();

    await db.collection("lessons").add({
      title,
      date,
      level,
      key,
    });
  }

  lessonModal.style.display = "none";
  loadLessons();
};

// -------------------------------
// تحميل الحصص من Firestore
// -------------------------------
async function loadLessons() {
  lessonsTable.innerHTML = "";

  const snapshot = await db.collection("lessons").orderBy("date", "desc").get();

  snapshot.forEach((doc) => {
    const data = doc.data();

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${data.title}</td>
      <td>${data.date}</td>
      <td>${data.level}</td>
      <td>${data.key}</td>
      <td class="actionBtns">
        <button class="edit" onclick="editLesson('${doc.id}', '${data.title}', '${data.date}', '${data.level}')">تعديل</button>
        <button class="delete" onclick="deleteLesson('${doc.id}')">حذف</button>
      </td>
    `;

    lessonsTable.appendChild(row);
  });
}

loadLessons();

// -------------------------------
// تعديل الحصة
// -------------------------------
window.editLesson = function (id, title, date, level) {
  editID = id;
  modalTitle.textContent = "تعديل الحصة";
  lessonTitle.value = title;
  lessonDate.value = date;
  lessonLevel.value = level;
  lessonModal.style.display = "flex";
};

// -------------------------------
// حذف
// -------------------------------
window.deleteLesson = async function (id) {
  if (confirm("هل أنت متأكد من الحذف؟")) {
    await db.collection("lessons").doc(id).delete();
    loadLessons();
  }
};
