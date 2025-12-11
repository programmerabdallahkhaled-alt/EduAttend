// attend.js - النسخة الكاملة بعد إضافة حالة الدفع

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
  doc,
  setDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

/* ======= config ======= */
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
let currentUser = null;
let currentLessonId = null;
let currentLessonKey = null;

/* ======= Auth ======= */
onAuthStateChanged(auth, user => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }
  currentUser = user;
  initPage();
});

/* logout */
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    try {
      await signOut(auth);
      window.location.href = "login.html";
    } catch (err) {
      alert("حدث خطأ أثناء تسجيل الخروج");
    }
  });
}

/* ======= fetch students by level ======= */
async function fetchStudentsByLevelSafe(levelString) {
  const resultsMap = new Map();

  // string
  try {
    const q1 = query(collection(db, "students"), where("level", "==", levelString));
    const snap1 = await getDocs(q1);
    snap1.forEach(d => resultsMap.set(d.id, d));
  } catch {}

  // number
  try {
    const num = Number(levelString);
    if (!Number.isNaN(num)) {
      const q2 = query(collection(db, "students"), where("level", "==", num));
      const snap2 = await getDocs(q2);
      snap2.forEach(d => resultsMap.set(d.id, d));
    }
  } catch {}

  return Array.from(resultsMap.values());
}

/* ======= Init ======= */
async function initPage() {
  const lessonsSnap = await getDocs(collection(db, "lessons"));

  lessonSelect.innerHTML = `<option value="">-- اختر حصة --</option>`;

  lessonsSnap.forEach(d => {
    const data = d.data();
    lessonsMap[d.id] = {
      lessonId: d.id,
      lessonKey: data.key || d.id,
      level: String(data.level || "").trim(),
      title: data.title || "حصة بدون عنوان",
      date: data.date || ""
    };

    const opt = document.createElement("option");
    opt.value = d.id;
    opt.textContent = `${data.title} — مستوى ${data.level}`;
    lessonSelect.appendChild(opt);
  });

  attendanceDate.value = new Date().toISOString().slice(0,10);
}

/* ======= Load students ======= */
if (loadStudentsBtn) {
  loadStudentsBtn.addEventListener("click", async () => {
    studentsTbody.innerHTML = "";

    const lessonId = lessonSelect.value;
    if (!lessonId) return alert("اختر حصة أولاً");

    const L = lessonsMap[lessonId];
    currentLessonId = lessonId;
    currentLessonKey = L.lessonKey;

    const studentsDocs = await fetchStudentsByLevelSafe(L.level);
    if (!studentsDocs.length) {
      studentsTbody.innerHTML = `<tr><td colspan="4">لا يوجد طلاب</td></tr>`;
      return;
    }

    // load attendance
    const attendanceCol = collection(db, "lessons", currentLessonId, "attendance");
    const attendanceSnap = await getDocs(attendanceCol);
    const attendanceMap = {};
    const today = attendanceDate.value;

    attendanceSnap.forEach(ad => {
      const d = ad.data();
      if (!d.date || d.date === today) {
        attendanceMap[ad.id] = {
          present: !!d.present,
          paid: d.paid === undefined ? true : !!d.paid
        };
      }
    });

    // build rows
    studentsDocs.forEach(s => {
      const data = s.data();
      const sid = s.id;

      const presentChecked = attendanceMap[sid]?.present ? "checked" : "";
      const paidChecked = attendanceMap[sid]?.paid !== false ? "checked" : "";

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${escapeHtml(data.name || "-")}</td>
        <td>${escapeHtml(data.level || "-")}</td>

        <td>
          <label class="switch">
            <input type="checkbox" data-type="present" data-student-id="${sid}" ${presentChecked}/>
            <span class="slider"></span>
          </label>
        </td>

        <td>
          <label class="switch">
            <input type="checkbox" data-type="paid" data-student-id="${sid}" ${paidChecked}/>
            <span class="slider"></span>
          </label>
        </td>
      `;

      studentsTbody.appendChild(tr);
    });
  });
}

/* ======= Clear ======= */
if (clearAttendanceBtn) {
  clearAttendanceBtn.addEventListener("click", () => {
    const checks = studentsTbody.querySelectorAll("input[type='checkbox']");
    checks.forEach(c => c.checked = false);
  });
}

/* ======= Save attendance ======= */
if (saveAttendanceBtn) {
  saveAttendanceBtn.addEventListener("click", async () => {
    if (!currentLessonId) return alert("قم بتحميل طلاب الحصة أولاً");

    const dateStr = attendanceDate.value;
    const checks = studentsTbody.querySelectorAll("input[data-type='present']");
    if (!checks.length) return alert("لا يوجد طلاب");

    const promises = [];

    checks.forEach(presentBox => {
      const studentId = presentBox.dataset.studentId;

      const paidBox = document.querySelector(`input[data-student-id="${studentId}"][data-type="paid"]`);
      const present = !!presentBox.checked;
      const paid = !!paidBox.checked;

      const ref = doc(db, "lessons", currentLessonId, "attendance", studentId);

      const payload = {
        present,
        paid,
        date: dateStr,
        teacherUid: currentUser.uid,
        updatedAt: new Date().toISOString()
      };

      promises.push(setDoc(ref, payload, { merge: true }));
    });

    await Promise.all(promises);
    alert("تم حفظ الحضور بنجاح ✔️");
  });
}

/* escape HTML */
function escapeHtml(str) {
  return str.replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
}
