import {
  getFirestore,
  collection,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import { app } from "./firebase.js";

const db = getFirestore(app);
const auth = getAuth(app);

// عناصر الصفحة
const lessonsSelect = document.getElementById("lessonsSelect");
const loadStudentsBtn = document.getElementById("loadStudentsBtn");
const studentsList = document.getElementById("studentsList");
const saveBtn = document.getElementById("saveBtn");
const logoutBtn = document.getElementById("logoutBtn");

// تحقق من تسجيل الدخول
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "index.html";
  }
});

// تسجيل الخروج
logoutBtn.onclick = async () => {
  await signOut(auth);
  window.location.href = "index.html";
};

// تحميل الحصص في القائمة
(async function loadLessons() {
  try {
    const qSnap = await getDocs(collection(db, "lessons"));
    lessonsSelect.innerHTML = '<option value="">اختر حصة</option>';

    qSnap.forEach((d) => {
      const L = d.data();
      lessonsSelect.innerHTML += `
        <option value="${d.id}">
          ${L.title} - ${L.date} (مستوى ${L.level})
        </option>
      `;
    });
  } catch (e) {
    console.error(e);
  }
})();

// عند الضغط على زر "تحميل الطلاب"
loadStudentsBtn.onclick = async () => {
  const lessonId = lessonsSelect.value;

  if (!lessonId) {
    alert("اختر الحصة أولًا");
    return;
  }

  studentsList.innerHTML = "<p>جاري تحميل الطلاب...</p>";

  try {
    // جلب بيانات الحصة
    const lessonSnap = await getDoc(doc(db, "lessons", lessonId));
    if (!lessonSnap.exists()) {
      studentsList.innerHTML = "<p>لم يتم العثور على بيانات الحصة.</p>";
      return;
    }

    const L = lessonSnap.data();
    const lessonLevel = String(L.level).trim(); // توحيد النوع

    // جلب الطلاب من نفس المستوى
    const qStu = query(
      collection(db, "students"),
      where("level", "==", lessonLevel)
    );

    const stuSnap = await getDocs(qStu);

    if (stuSnap.empty) {
      studentsList.innerHTML = "<p>لا يوجد طلاب لهذا المستوى.</p>";
      return;
    }

    // تفريغ القائمة
    studentsList.innerHTML = "";

    // جلب الحضور السابق للحصة
    const attendanceSnap = await getDocs(
      collection(db, "lessons", lessonId, "attendance")
    );

    const attended = {};
    attendanceSnap.forEach((d) => {
      attended[d.id] = d.data().present === true;
    });

    // عرض الطلاب مع تحديد الحضور السابق
    stuSnap.forEach((d) => {
      const stu = d.data();
      const checked = attended[d.id] ? "checked" : "";

      const div = document.createElement("div");
      div.classList.add("student-item");

      div.innerHTML = `
        <span>${stu.name}</span>
        <input type="checkbox" data-id="${d.id}" ${checked} />
      `;

      studentsList.appendChild(div);
    });
  } catch (error) {
    studentsList.innerHTML = "<p>حدث خطأ أثناء تحميل الطلاب.</p>";
    console.error(error);
  }
};

// حفظ الحضور
saveBtn.onclick = async () => {
  const lessonId = lessonsSelect.value;
  if (!lessonId) {
    alert("اختر الحصة أولًا");
    return;
  }

  const checkboxes = document.querySelectorAll(".student-item input");

  try {
    for (const cb of checkboxes) {
      const studentId = cb.getAttribute("data-id");
      const present = cb.checked;

      await setDoc(
        doc(db, "lessons", lessonId, "attendance", studentId),
        { present },
        { merge: true }
      );
    }

    alert("تم حفظ الحضور بنجاح");
  } catch (error) {
    console.error(error);
    alert("فشل حفظ البيانات");
  }
};
