// =============================
// lessons.js - إدارة الحصص
// =============================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
  getFirestore, collection, addDoc, updateDoc, deleteDoc, doc, getDocs, orderBy, query 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { 
  getAuth, onAuthStateChanged, signOut 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// -------------------------------
// Firebase Init
// -------------------------------
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
const auth = getAuth(app);

// -------------------------------
// حماية الصفحة
// -------------------------------
onAuthStateChanged(auth, (user) => {
  if (!user) window.location.href = "index.html";
});

// -------------------------------
// عناصر DOM
// -------------------------------
const addLessonBtn = document.getElementById("addLessonBtn");
const logoutBtn = document.getElementById("logoutBtn");

const lessonModal = document.getElementById("lessonModal");
const closeModal = document.getElementById("closeModal");
const saveLesson = document.getElementById("saveLesson");

const modalTitle = document.getElementById("modalTitle");
const lessonTitle = document.getElementById("lessonTitle");
const lessonDate = document.getElementById("lessonDate");
const lessonLevel = document.getElementById("lessonLevel");
const lessonsTable = document.getElementById("lessonsTable");

let editID = null;

// -------------------------------
// زر فتح نافذة إضافة حصة
// -------------------------------
addLessonBtn.addEventListener("click", () => {
  modalTitle.textContent = "إضافة حصة";
  editID = null;
  lessonTitle.value = "";
  lessonDate.value = "";
  lessonLevel.value = "1";
  lessonModal.style.display = "flex";
});

// -------------------------------
closeModal.addEventListener("click", () => {
  lessonModal.style.display = "none";
});

// -------------------------------
// توليد مفتاح الحصة
// -------------------------------
function generateLessonKey() {
  let r = Math.floor(Math.random() * 10 ** 11).toString().padStart(11, "0");
  return "lesson_" + r;
}

// -------------------------------
// حفظ الحصة
// -------------------------------
saveLesson.addEventListener("click", async () => {
  const title = lessonTitle.value.trim();
  const date = lessonDate.value;
  const level = lessonLevel.value;

  if (!title || !date) {
    alert("يرجى ملء جميع البيانات");
    return;
  }

  if (editID) {
    await updateDoc(doc(db, "lessons", editID), {
      title, date, level
    });
  } else {
    const key = generateLessonKey();

    await addDoc(collection(db, "lessons"), {
      title,
      date,
      level,
      key
    });
  }

  lessonModal.style.display = "none";
  loadLessons();
});

// -------------------------------
// تحميل الحصص
// -------------------------------
async function loadLessons() {
  lessonsTable.innerHTML = "";

  const q = query(collection(db, "lessons"), orderBy("date", "desc"));
  const snap = await getDocs(q);

  snap.forEach((docItem) => {
    const data = docItem.data();

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${data.title}</td>
      <td>${data.date}</td>
      <td>${data.level}</td>
      <td>${data.key}</td>
      <td>
        <button class="edit" onclick="editLesson('${docItem.id}', '${data.title}', '${data.date}', '${data.level}')">تعديل</button>
        <button class="delete" onclick="deleteLesson('${docItem.id}')">حذف</button>
      </td>
    `;

    lessonsTable.appendChild(row);
  });
}

loadLessons();

// -------------------------------
// تعديل الحصة
// -------------------------------
window.editLesson = function(id, title, date, level) {
  editID = id;
  modalTitle.textContent = "تعديل الحصة";
  lessonTitle.value = title;
  lessonDate.value = date;
  lessonLevel.value = level;
  lessonModal.style.display = "flex";
};

// -------------------------------
// حذف الحصة
// -------------------------------
window.deleteLesson = async function(id) {
  if (confirm("هل أنت متأكد من الحذف؟")) {
    await deleteDoc(doc(db, "lessons", id));
    loadLessons();
  }
};

// -------------------------------
// تسجيل خروج
// -------------------------------
logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "login.html";
});
