// ===== Firebase Init =====
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyADeo3Nc2lqGKtnr_UqfNEZB28aGUCQsrc",
  authDomain: "eduattend-90a3d.firebaseapp.com",
  projectId: "eduattend-90a3d",
  storageBucket: "eduattend-90a3d.firebasestorage.app",
  messagingSenderId: "1002840427136",
  appId: "1:1002840427136:web:9de92f16a4303c8f117465"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ===== عناصر DOM =====
const studentsTable = document.getElementById("studentsTable");
const addStudentBtn = document.getElementById("addStudentBtn");
const filterLevel = document.getElementById("filterLevel");

const modal = document.getElementById("studentModal");
const modalTitle = document.getElementById("modalTitle");
const studentName = document.getElementById("studentName");
const studentPhone = document.getElementById("studentPhone");
const studentLevel = document.getElementById("studentLevel");
const saveStudent = document.getElementById("saveStudent");
const closeModal = document.getElementById("closeModal");

let editId = null;

// ===== التحقق من تسجيل الدخول =====
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "login.html";
  } else {
    loadStudents();
  }
});

document.getElementById("logoutBtn").onclick = () => signOut(auth);

// ===== تحميل الطلاب =====
async function loadStudents() {
  studentsTable.innerHTML = "";

  let q;
  if (filterLevel.value === "all") {
    q = collection(db, "students");
  } else {
    q = query(collection(db, "students"), where("level", "==", filterLevel.value));
  }

  const snap = await getDocs(q);
  snap.forEach((docData) => {
    const s = docData.data();

    studentsTable.innerHTML += `
      <tr>
        <td>${s.name}</td>
        <td>${s.phone}</td>
        <td>${getLevelName(s.level)}</td>
        <td>
          <button class="action-btn edit" onclick="editStudent('${docData.id}', '${s.name}', '${s.phone}', '${s.level}')">تعديل</button>
          <button class="action-btn delete" onclick="deleteStudent('${docData.id}')">حذف</button>
        </td>
      </tr>`;
  });
}

filterLevel.onchange = loadStudents;

function getLevelName(level) {
  return level === "1" ? "أولى ثانوي" : level === "2" ? "ثانية ثانوي" : "ثالثة ثانوي";
}

// ===== فتح مودال إضافة طالب =====
addStudentBtn.onclick = () => {
  modal.style.display = "flex";
  modalTitle.textContent = "إضافة طالب";
  studentName.value = "";
  studentPhone.value = "";
  studentLevel.value = "1";
  editId = null;
};

closeModal.onclick = () => (modal.style.display = "none");

// ===== حفظ (إضافة / تعديل) طالب =====
saveStudent.onclick = async () => {
  const name = studentName.value.trim();
  const phone = studentPhone.value.trim();
  const level = studentLevel.value;

  if (!name || !phone) return alert("برجاء إدخال البيانات كاملة");

  if (editId) {
    await updateDoc(doc(db, "students", editId), { name, phone, level });
  } else {
    await addDoc(collection(db, "students"), { name, phone, level });
  }

  modal.style.display = "none";
  loadStudents();
};

// ===== تعديل طالب =====
window.editStudent = (id, name, phone, level) => {
  editId = id;
  modal.style.display = "flex";
  modalTitle.textContent = "تعديل طالب";
  studentName.value = name;
  studentPhone.value = phone;
  studentLevel.value = level;
};

// ===== حذف طالب =====
window.deleteStudent = async (id) => {
  if (confirm("هل تريد حذف الطالب؟")) {
    await deleteDoc(doc(db, "students", id));
    loadStudents();
  }
};
