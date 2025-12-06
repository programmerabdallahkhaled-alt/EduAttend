// attend.js (final)

// ==========================
// Firebase
// ==========================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore, collection, getDocs, query, where,
  doc, setDoc, getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import {
  getAuth, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

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

// ==========================
// DOM
// ==========================
const lessonSelect = document.getElementById("lessonSelect");
const loadStudentsBtn = document.getElementById("loadStudentsBtn");
const attendanceDate = document.getElementById("attendanceDate");
const studentsTbody = document.getElementById("studentsTbody");
const saveAttendanceBtn = document.getElementById("saveAttendance");
const clearAttendanceBtn = document.getElementById("clearAttendance");
const logoutBtn = document.getElementById("logoutBtn");

// ==========================
// Vars
// ==========================
let lessonsMap = {}; // lessonId → lessonData INCLUDING lessonKey
let currentUser = null;
let currentLessonKey = null;

// ==========================
// Auth Check
// ==========================
onAuthStateChanged(auth, user => {
  if (!user) return (window.location.href = "index.html");
  currentUser = user;
  initPage();
});

// ==========================
// Logout
// ==========================
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    await auth.signOut();
    window.location.href = "login.html";
  });
}

// ==========================
// Load Lessons
// ==========================
async function initPage() {
  lessonSelect.innerHTML = `<option value="">-- اختر حصة --</option>`;

  const snap = await getDocs(collection(db, "lessons"));

  snap.forEach(d => {
    const L = d.data();
    const lessonKey = L.key; // 🔵 المفتاح الحقيقي للحصة

    lessonsMap[d.id] = {
      lessonId: d.id,
      lessonKey,
      title: L.title || "حصة بدون عنوان",
      level: L.level,
      date: L.date || ""
    };

    const opt = document.createElement("option");
    opt.value = d.id;
    opt.textContent = `${L.title} — مستوى ${L.level}`;
    lessonSelect.appendChild(opt);
  });

  attendanceDate.value = new Date().toISOString().slice(0, 10);
}

// ==========================
// Load Students for Lesson
// ==========================
loadStudentsBtn.onclick = async () => {
  studentsList.innerHTML = "<p>جاري تحميل الطلاب...</p>";

  try {
    const lessonSnap = await getDoc(doc(db, "lessons", lessonId));
    if (!lessonSnap.exists()) {
      studentsList.innerHTML = "<p>لم يتم العثور على بيانات الحصة.</p>";
      return;
    }

    const L = lessonSnap.data();

    // 🔥 توحيد النوع (نحوّل الاثنين لنص)
    const lessonLevel = String(L.level).trim();

    const q = query(
      collection(db, "students"),
      where("level", "==", lessonLevel)
    );

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      studentsList.innerHTML = "<p>لا يوجد طلاب لهذا المستوى.</p>";
      return;
    }

    studentsList.innerHTML = "";

    querySnapshot.forEach((docu) => {
      const stu = docu.data();

      const div = document.createElement("div");
      div.classList.add("student-item");

      div.innerHTML = `
        <span>${stu.name}</span>
        <input type="checkbox" data-id="${docu.id}" />
      `;

      studentsList.appendChild(div);
    });
  } catch (error) {
    studentsList.innerHTML = "<p>حدث خطأ أثناء تحميل الطلاب.</p>";
    console.error(error);
  }
};


  // ==========================
  // Build Students Table
  // ==========================
  snap.forEach(snap => {
    const S = snap.data();
    const studentId = snap.id;

    const checked = oldAttendance[studentId] ? "checked" : "";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${S.name}</td>
      <td>${S.level}</td>
      <td>
        <label class="switch">
          <input type="checkbox" data-student-id="${studentId}" ${checked} />
          <span class="slider"></span>
        </label>
      </td>
    `;
    studentsTbody.appendChild(tr);
  });
});

// ==========================
// Clear
// ==========================
clearAttendanceBtn.addEventListener("click", () => {
  studentsTbody.querySelectorAll("input[type=checkbox]").forEach(c => c.checked = false);
});

// ==========================
// Save Attendance
// ==========================
saveAttendanceBtn.addEventListener("click", async () => {

  if (!currentLessonKey)
    return alert("اختر الحصة واضغط تحميل الطلاب أولاً");

  const dateStr = attendanceDate.value;
  if (!dateStr) return alert("اختر التاريخ");

  const checks = studentsTbody.querySelectorAll("input[type=checkbox]");
  if (checks.length === 0) return alert("لا يوجد طلاب");

  const p = [];

  checks.forEach(ch => {
    const studentId = ch.dataset.studentId;
    const present = ch.checked;

    const ref = doc(db,
      "lessons",
      currentLessonKey,
      "attendance",
      studentId
    );

    p.push(setDoc(ref, {
      present,
      date: dateStr,
      updatedAt: new Date().toISOString(),
      teacherUid: currentUser.uid
    }));
  });

  await Promise.all(p);
  alert("تم حفظ الحضور بنجاح ✔");
});
