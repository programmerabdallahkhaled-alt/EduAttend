// attend.js (module) - نسخة مصححة ومجربة
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

// عناصر DOM — تأكد إنها موجودة في HTML
const lessonSelect = document.getElementById("lessonSelect");
const loadStudentsBtn = document.getElementById("loadStudentsBtn");
const attendanceDate = document.getElementById("attendanceDate");
const studentsTbody = document.getElementById("studentsTbody");
const saveAttendanceBtn = document.getElementById("saveAttendance");
const clearAttendanceBtn = document.getElementById("clearAttendance");
const logoutBtn = document.getElementById("logoutBtn");

if (!lessonSelect || !loadStudentsBtn || !attendanceDate || !studentsTbody || !saveAttendanceBtn || !clearAttendanceBtn) {
  console.error("عنصر/عناصر DOM غير موجودة — تأكد من ال IDs في HTML");
  // لا نكمل إذا DOM ناقصة
}

let lessonsMap = {}; // map: lessonId -> { key, level, title, date }
let currentUser = null;
let currentLesson = null;

// تأكد من تسجيل الدخول، ثم نفّذ initPage
onAuthStateChanged(auth, user => {
  if (!user) {
    console.log("No user — redirecting to login");
    window.location.href = "index.html";
    return;
  }
  currentUser = user;
  initPage();
});

// زر تسجيل الخروج (لو موجود)
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    try {
      await auth.signOut();
      window.location.href = "login.html";
    } catch (err) {
      console.error("Logout error:", err);
      alert("حدث خطأ أثناء تسجيل الخروج");
    }
  });
}

// جلب الحصص وتعبئة الـ select
async function initPage() {
  try {
    lessonSelect.innerHTML = `<option value="">-- اختر حصة --</option>`;

    const lessonsSnap = await getDocs(collection(db, "lessons"));
    console.log("lessons snapshot size:", lessonsSnap.size);

    lessonsSnap.forEach(d => {
      const data = d.data() || {};
      // fallback آمن بدون استخدام ??
      const key = (data.key !== undefined && data.key !== null && data.key !== "") ? data.key : `lesson_${d.id}`;
      const level = (data.level !== undefined && data.level !== null) ? String(data.level) : "";
      const title = data.title ? String(data.title) : "حصة بدون عنوان";

      lessonsMap[d.id] = { key, level, title, date: data.date || "" };

      const opt = document.createElement("option");
      opt.value = d.id;
      opt.textContent = `${title} — مستوى ${level || "-"}`;
      lessonSelect.appendChild(opt);
    });

    // إذا ما فيش حصص، أعرض رسالة في الـ console
    if (lessonsSnap.size === 0) {
      console.warn("لا توجد حِصص في مجموعة `lessons` (Firestore) — تأكد من وجود مستندات");
    }

    // حدد تاريخ اليوم كافتراضي لو العنصر موجود
    if (attendanceDate) {
      const today = new Date().toISOString().slice(0,10);
      attendanceDate.value = today;
    }

  } catch (err) {
    console.error("Error loading lessons:", err);
    alert("حدث خطأ أثناء تحميل الحصص. افتح Console للمزيد.");
  }
}

// عند الضغط على تحميل الطلاب
if (loadStudentsBtn) {
  loadStudentsBtn.addEventListener("click", async () => {
    studentsTbody.innerHTML = "";
    const lessonId = lessonSelect.value;
    if (!lessonId) {
      alert("اختر حصة أولاً");
      return;
    }

    currentLesson = lessonsMap[lessonId];
    if (!currentLesson) {
      alert("بيانات الحصة غير متاحة (راجع Firestore أو console).");
      return;
    }

    try {
      const lvl = currentLesson.level;
      // إذا المستوى ليس رقمياً حاول تحويله
      const lvlNum = isNaN(Number(lvl)) ? lvl : Number(lvl);
      const q = query(collection(db, "students"), where("level", "==", lvlNum));
      const studentsSnap = await getDocs(q);

      if (!studentsSnap || studentsSnap.size === 0) {
        studentsTbody.innerHTML = `<tr><td colspan="3">لا يوجد طلاب لهذا المستوى</td></tr>`;
        return;
      }

      studentsSnap.forEach(snap => {
        const s = snap.data() || {};
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${s.name ? s.name : "-"}</td>
          <td>${s.level !== undefined ? s.level : "-"}</td>
          <td>
            <label class="switch">
              <input type="checkbox" data-student-id="${snap.id}" />
              <span class="slider"></span>
            </label>
          </td>
        `;
        studentsTbody.appendChild(tr);
      });

    } catch (err) {
      console.error("Error loading students for lesson:", err);
      alert("حدث خطأ أثناء تحميل طلاب الحصة. افتح Console للمزيد.");
    }
  });
}

// مسح الاختيارات
if (clearAttendanceBtn) {
  clearAttendanceBtn.addEventListener("click", () => {
    const checks = studentsTbody.querySelectorAll('input[type="checkbox"]');
    checks.forEach(c => c.checked = false);
  });
}

// حفظ الحضور
if (saveAttendanceBtn) {
  saveAttendanceBtn.addEventListener("click", async () => {
    if (!currentLesson) {
      alert("قم بتحميل طلاب الحصة أولاً.");
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
      alert("لا يوجد طلاب للحفظ");
      return;
    }

    try {
      const promises = [];
      checks.forEach(ch => {
        const studentId = ch.dataset.studentId;
        const present = !!ch.checked;
        const docRef = doc(db, "attendances", lessonKey, "students", studentId);
        const payload = {
          present,
          date: dateStr,
          lessonKey,
          teacherUid: currentUser ? currentUser.uid : null,
          updatedAt: new Date().toISOString()
        };
        promises.push( setDoc(docRef, payload) );
      });

      await Promise.all(promises);
      alert("تم حفظ الحضور بنجاح ✅");
    } catch (err) {
      console.error("Save attendance error:", err);
      alert("حدث خطأ أثناء الحفظ. افتح Console للمزيد.");
    }
  });
}
