// attend.js (module)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore, collection, getDocs, query, where, doc, setDoc
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




const test = await getDocs(collection(db, "lessons"));
console.log("TEST LESSONS:", test.size);
test.forEach(d => console.log("data:", d.data()));





const lessonSelect = document.getElementById("lessonSelect");
const loadStudentsBtn = document.getElementById("loadStudentsBtn");
const attendanceDate = document.getElementById("attendanceDate");
const studentsTbody = document.getElementById("studentsTbody");
const saveAttendanceBtn = document.getElementById("saveAttendance");
const clearAttendanceBtn = document.getElementById("clearAttendance");
const logoutBtn = document.getElementById("logoutBtn");

let lessonsMap = {}; // lessonId -> { key, level, title, date }
let currentUser = null;
let currentLesson = null;

// تأكد من تسجيل الدخول
onAuthStateChanged(auth, user => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }
  currentUser = user;
  initPage();
});

logoutBtn?.addEventListener("click", async () => {
  await auth.signOut();
  window.location.href = "login.html";
});

// جلب الحصص وتعبئة الـ select
async function initPage() {
  lessonSelect.innerHTML = `<option value="">-- اختر حصة --</option>`;
  const lessonsSnap = await getDocs(collection(db, "lessons"));
  lessonsSnap.forEach(d => {
    const data = d.data();
    lessonsMap[d.id] = { key: data.key || data.key ?? (`lesson_${d.id}`), level: String(data.level), title: data.title || "بدون عنوان", date: data.date || "" };
    const opt = document.createElement("option");
    opt.value = d.id;
    opt.textContent = `${data.title || "حصة"} — مستوى ${data.level || "-"}`;
    lessonSelect.appendChild(opt);
  });

  // حدد تاريخ اليوم كافتراضي
  const today = new Date().toISOString().slice(0,10);
  attendanceDate.value = today;
}

// عند الضغط على تحميل الطلاب
loadStudentsBtn.addEventListener("click", async () => {
  const lessonId = lessonSelect.value;
  studentsTbody.innerHTML = "";
  if (!lessonId) {
    alert("اختر حصة أولاً");
    return;
  }

  currentLesson = lessonsMap[lessonId];
  if (!currentLesson) {
    alert("خطأ: بيانات الحصة غير متاحة");
    return;
  }

  // جلب الطلاب لنفس المستوى
  const lvl = currentLesson.level;
  const q = query(collection(db, "students"), where("level", "==", Number(lvl)));
  const studentsSnap = await getDocs(q);

  if (studentsSnap.empty) {
    studentsTbody.innerHTML = `<tr><td colspan="3">لا يوجد طلاب لهذا المستوى</td></tr>`;
    return;
  }

  studentsSnap.forEach(snap => {
    const s = snap.data();
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${s.name || "-"}</td>
      <td>${s.level || "-"}</td>
      <td>
        <label class="switch">
          <input type="checkbox" data-student-id="${snap.id}" />
          <span class="slider"></span>
        </label>
      </td>
    `;
    studentsTbody.appendChild(tr);
  });
});

// مسح الاختيارات (إعادة ضبط)
clearAttendanceBtn.addEventListener("click", () => {
  const checks = studentsTbody.querySelectorAll('input[type="checkbox"]');
  checks.forEach(c => c.checked = false);
});

// حفظ الحضور
saveAttendanceBtn.addEventListener("click", async () => {
  if (!currentLesson) {
    alert("حمّل طلاب الحصة أولاً");
    return;
  }
  const dateStr = attendanceDate.value;
  if (!dateStr) {
    alert("اختر تاريخ الحضور");
    return;
  }

  const lessonKey = currentLesson.key || `lesson_${lessonSelect.value}`;
  const checks = studentsTbody.querySelectorAll('input[type="checkbox"]');

  if (checks.length === 0) {
    alert("لا يوجد طلاب محفوظين للعرض");
    return;
  }

  try {
    // لكل طالب احفظ مستند داخل: attendances/{lessonKey}/students/{studentId}
    const promises = [];
    checks.forEach(ch => {
      const studentId = ch.dataset.studentId;
      const present = ch.checked;
      const docRef = doc(db, "attendances", lessonKey, "students", studentId);
      const payload = {
        present,
        date: dateStr,
        lessonKey,
        teacherUid: currentUser.uid,
        updatedAt: new Date().toISOString()
      };
      promises.push( setDoc(docRef, payload) );
    });

    await Promise.all(promises);
    alert("تم حفظ الحضور بنجاح ✅");
  } catch (err) {
    console.error("Save attendance error:", err);
    alert("حدث خطأ أثناء الحفظ");
  }
});
