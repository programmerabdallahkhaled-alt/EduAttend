// attend.js - النسخة النهائية

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
  doc,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

/* ======= Firebase config ======= */
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

/* ======= DOM ======= */
const lessonSelect = document.getElementById("lessonSelect");
const loadStudentsBtn = document.getElementById("loadStudentsBtn");
const attendanceDate = document.getElementById("attendanceDate");
const studentsTbody = document.getElementById("studentsTbody");
const saveAttendanceBtn = document.getElementById("saveAttendance");
const clearAttendanceBtn = document.getElementById("clearAttendance");
const logoutBtn = document.getElementById("logoutBtn");

/* ======= State ======= */
let lessonsMap = {};
let currentLessonId = null;
let currentUser = null;

/* ======= Auth ======= */
onAuthStateChanged(auth, user => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }
  currentUser = user;
  initPage();
});

logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "login.html";
});

/* ======= Fix: universal filter ======= */
async function fetchStudentsByLevelUniversal(level) {
  const allSnap = await getDocs(collection(db, "students"));
  const clean = v => String(v).trim();
  const target = clean(level);

  const result = [];
  allSnap.forEach(d => {
    const s = d.data();
    if (s.level === undefined) return;

    if (clean(s.level) === target) {
      result.push(d);
    }
  });

  return result;
}

/* ======= Load lessons ======= */
async function initPage() {
  lessonSelect.innerHTML = `<option value="">-- اختر حصة --</option>`;

  const lessonsSnap = await getDocs(collection(db, "lessons"));
  lessonsSnap.forEach(d => {
    const data = d.data();
    lessonsMap[d.id] = {
      level: String(data.level).trim(),
      title: data.title,
      date: data.date,
      key: data.key
    };

    const opt = document.createElement("option");
    opt.value = d.id;
    opt.textContent = `${data.title} — مستوى ${data.level}`;
    lessonSelect.appendChild(opt);
  });

  attendanceDate.value = new Date().toISOString().slice(0, 10);
}

/* ======= Load students ======= */
loadStudentsBtn.addEventListener("click", async () => {
  studentsTbody.innerHTML = "";
  const lessonId = lessonSelect.value;

  if (!lessonId) {
    alert("اختر حصة أولاً");
    return;
  }

  currentLessonId = lessonId;
  const lessonInfo = lessonsMap[lessonId];

  const studentDocs = await fetchStudentsByLevelUniversal(lessonInfo.level);

  if (studentDocs.length === 0) {
    studentsTbody.innerHTML = `<tr><td colspan="4">لا يوجد طلاب لهذا المستوى</td></tr>`;
    return;
  }

  const attendanceCol = collection(db, "lessons", lessonId, "attendance");
  const attendanceSnap = await getDocs(attendanceCol);

  const attendanceMap = {};
  attendanceSnap.forEach(ad => {
    attendanceMap[ad.id] = ad.data();
  });

  studentDocs.forEach(snap => {
    const s = snap.data();
    const sid = snap.id;

    const old = attendanceMap[sid] || {};

    const presentChecked = old.present ? "checked" : "";
    const paidChecked = (old.paid !== false) ? "checked" : "";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${s.name}</td>
      <td>${s.level}</td>

      <td>
        <label class="switch">
          <input type="checkbox" class="presentBox" data-sid="${sid}" ${presentChecked}>
          <span class="slider"></span>
        </label>
      </td>

      <td>
        <label class="switch">
          <input type="checkbox" class="paidBox" data-sid="${sid}" ${paidChecked}>
          <span class="slider"></span>
        </label>
      </td>
    `;

    studentsTbody.appendChild(tr);
  });
});

/* ======= Clear ======= */
clearAttendanceBtn.addEventListener("click", () => {
  const checks = studentsTbody.querySelectorAll("input[type='checkbox']");
  checks.forEach(c => c.checked = false);
});

/* ======= Save Attendance ======= */
saveAttendanceBtn.addEventListener("click", async () => {
  if (!currentLessonId) {
    alert("قم بتحميل طلاب الحصة أولاً");
    return;
  }

  const dateStr = attendanceDate.value;

  const presentBoxes = document.querySelectorAll(".presentBox");
  const paidBoxes = document.querySelectorAll(".paidBox");

  const promises = [];

  presentBoxes.forEach((box, i) => {
    const sid = box.dataset.sid;

    const present = box.checked;
    const paid = paidBoxes[i].checked;

    const ref = doc(db, "lessons", currentLessonId, "attendance", sid);

    promises.push(setDoc(ref, {
      present,
      paid,
      date: dateStr,
      updatedAt: new Date().toISOString(),
      teacherUid: currentUser.uid
    }, { merge: true }));
  });

  await Promise.all(promises);
  alert("تم حفظ الحضور بنجاح");
});

/* ======= Safe HTML ======= */
function escapeHtml(str) {
  return str.replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
