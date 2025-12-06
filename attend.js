// attend.js - مصحح ونهائي (module)
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

/* تحقق من أن العناصر موجودة */
if (!lessonSelect || !loadStudentsBtn || !attendanceDate || !studentsTbody || !saveAttendanceBtn || !clearAttendanceBtn) {
  console.error("عنصر/عناصر DOM غير موجودة — تأكد من ال IDs: lessonSelect, loadStudentsBtn, attendanceDate, studentsTbody, saveAttendance, clearAttendance");
  // لا نكمل تنفيذ باقي الكود لأن الصفحة ناقصة عناصر
}

/* ======= State ======= */
let lessonsMap = {}; // lessonId -> { key, level, title, date }
let currentUser = null;
let currentLessonId = null; // Firestore doc id for lesson
let currentLessonKey = null; // the 'key' field inside lesson doc

/* ======= Auth ======= */
onAuthStateChanged(auth, user => {
  if (!user) {
    console.log("No user — redirecting to login");
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
      console.error("Logout error:", err);
      alert("حدث خطأ أثناء تسجيل الخروج");
    }
  });
}

/* ======= Helpers ======= */

/**
 * fetchStudentsByLevelSafe(levelString)
 * يحاول جلب الطلاب أولًا بالمطابقة كسلسلة نصية ثم كرقم إن لم تجد نتائج،
 * ويعيد مصفوفة من سجلات المستندات (DocumentSnapshot) بدون تكرار.
 */
async function fetchStudentsByLevelSafe(levelString) {
  const resultsMap = new Map();

  // Attempt 1: as string
  try {
    const q1 = query(collection(db, "students"), where("level", "==", levelString));
    const snap1 = await getDocs(q1);
    snap1.forEach(d => resultsMap.set(d.id, d));
  } catch (e) {
    console.warn("error querying students by string level:", e);
  }

  // If none found, try as number (or always also try numeric to catch mixed types)
  try {
    const num = Number(levelString);
    if (!Number.isNaN(num)) {
      const q2 = query(collection(db, "students"), where("level", "==", num));
      const snap2 = await getDocs(q2);
      snap2.forEach(d => resultsMap.set(d.id, d));
    }
  } catch (e) {
    console.warn("error querying students by numeric level:", e);
  }

  // return array of DocumentSnapshot
  return Array.from(resultsMap.values());
}

/* ======= Init: load lessons list ======= */
async function initPage() {
  try {
    if (!lessonSelect) return;
    lessonSelect.innerHTML = `<option value="">-- اختر حصة --</option>`;

    const lessonsSnap = await getDocs(collection(db, "lessons"));
    console.log("lessons snapshot size:", lessonsSnap.size);

    lessonsSnap.forEach(d => {
      const data = d.data() || {};
      const key = (data.key !== undefined && data.key !== null && data.key !== "") ? String(data.key) : d.id;
      const level = (data.level !== undefined && data.level !== null) ? String(data.level).trim() : "";
      const title = data.title ? String(data.title) : "حصة بدون عنوان";

      lessonsMap[d.id] = { lessonId: d.id, lessonKey: key, level, title, date: data.date || "" };

      const opt = document.createElement("option");
      opt.value = d.id; // store Firestore doc id
      opt.textContent = `${title} — مستوى ${level || "-"}`;
      lessonSelect.appendChild(opt);
    });

    // default date today
    if (attendanceDate) attendanceDate.value = new Date().toISOString().slice(0,10);

    if (lessonsSnap.size === 0) {
      console.warn("لا توجد حِصص في مجموعة `lessons` (Firestore) — تأكد من وجود مستندات");
    }

  } catch (err) {
    console.error("Error loading lessons:", err);
    alert("حدث خطأ أثناء تحميل الحصص. افتح Console للمزيد.");
  }
}

/* ======= Load students on button click ======= */
if (loadStudentsBtn) {
  loadStudentsBtn.addEventListener("click", async () => {
    if (!studentsTbody) return;
    studentsTbody.innerHTML = ""; // clear
    const lessonId = lessonSelect?.value;
    if (!lessonId) {
      alert("اختر حصة أولاً");
      return;
    }

    const L = lessonsMap[lessonId];
    if (!L) {
      alert("بيانات الحصة غير متاحة (راجع Firestore أو console).");
      return;
    }

    currentLessonId = lessonId;
    currentLessonKey = L.lessonKey;

    try {
      // unify level as string for searching
      const lessonLevelStr = String(L.level).trim();

      // fetch students safely (string or number)
      const studentDocs = await fetchStudentsByLevelSafe(lessonLevelStr);

      if (!studentDocs || studentDocs.length === 0) {
        studentsTbody.innerHTML = `<tr><td colspan="3">لا يوجد طلاب لهذا المستوى</td></tr>`;
        return;
      }

      // load attendance subcollection for this lesson (all docs)
      const attendanceCol = collection(db, "lessons", currentLessonId, "attendance");
      const attendanceSnap = await getDocs(attendanceCol);
      const attendanceMap = {}; // studentId -> present for the selected date
      const today = attendanceDate?.value || new Date().toISOString().slice(0,10);

      attendanceSnap.forEach(ad => {
        const d = ad.data() || {};
        // if attendance docs carry a date field, match by date; otherwise consider last saved
        if (!d.date || d.date === today) {
          attendanceMap[ad.id] = !!d.present;
        }
      });

      // build rows
      studentDocs.forEach(snap => {
        const s = snap.data() || {};
        const sid = snap.id;
        const presentChecked = attendanceMap[sid] ? "checked" : "";

        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${escapeHtml(String(s.name || "-"))}</td>
          <td>${escapeHtml(String(s.level !== undefined ? s.level : "-"))}</td>
          <td>
            <label class="switch">
              <input type="checkbox" data-student-id="${sid}" ${presentChecked}/>
              <span class="slider"></span>
            </label>
          </td>
        `;
        studentsTbody.appendChild(tr);
      });

    } catch (err) {
      console.error("Error loading students for lesson:", err);
      studentsTbody.innerHTML = `<tr><td colspan="3">حدث خطأ أثناء تحميل طلاب الحصة</td></tr>`;
    }
  });
}

/* ======= Clear selections ======= */
if (clearAttendanceBtn) {
  clearAttendanceBtn.addEventListener("click", () => {
    const checks = studentsTbody.querySelectorAll('input[type="checkbox"]');
    checks.forEach(c => c.checked = false);
  });
}

/* ======= Save attendance ======= */
if (saveAttendanceBtn) {
  saveAttendanceBtn.addEventListener("click", async () => {
    if (!currentLessonId) {
      alert("قم بتحميل طلاب الحصة أولاً.");
      return;
    }
    const dateStr = attendanceDate?.value;
    if (!dateStr) {
      alert("اختر تاريخ الحضور");
      return;
    }

    const checks = studentsTbody.querySelectorAll('input[type="checkbox"]');
    if (!checks || checks.length === 0) {
      alert("لا يوجد طلاب للحفظ");
      return;
    }

    try {
      const promises = [];
      checks.forEach(ch => {
        const studentId = ch.dataset.studentId;
        const present = !!ch.checked;

        const ref = doc(db, "lessons", currentLessonId, "attendance", studentId);
        const payload = {
          present,
          date: dateStr,
          teacherUid: currentUser ? currentUser.uid : null,
          updatedAt: new Date().toISOString()
        };
        promises.push(setDoc(ref, payload, { merge: true }));
      });

      await Promise.all(promises);
      alert("تم حفظ الحضور بنجاح ✅");
    } catch (err) {
      console.error("Save attendance error:", err);
      alert("حدث خطأ أثناء الحفظ. افتح Console للمزيد.");
    }
  });
}

/* ======= Utility: escape HTML to avoid injection in table cells ======= */
function escapeHtml(str) {
  return str.replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
}
