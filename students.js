// ===== Firebase Init =====
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
  getAuth, 
  onAuthStateChanged, 
  signOut 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import { 
  getFirestore, 
  collection, 
  getDocs, 
  deleteDoc,
  doc,
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



// ===== التأكد من تسجيل الدخول =====
onAuthStateChanged(auth, (user) => {
  if (!user) window.location.href = "index.html";
  else loadStudents();
});



// ===== زر تسجيل الخروج =====
document.getElementById("logoutBtn").addEventListener("click", async () => {
  await signOut(auth);
});



// ===== زر إضافة طالب =====
document.getElementById("addStudentBtn").addEventListener("click", () => {
  window.location.href = "addStudent.html";
});



// ===== تحميل الطلاب =====
async function loadStudents(filterLevel = "all") {
  const table = document.getElementById("studentsTable");
  table.innerHTML = "";

  let ref = collection(db, "students");
  let q;

  if (filterLevel !== "all")
    q = query(ref, where("level", "==", filterLevel));
  else
    q = ref;

  const snapshot = await getDocs(q);

  snapshot.forEach((docSnap) => {
    const student = docSnap.data();

    table.innerHTML += `
      <tr>
        <td>${student.name}</td>
        <td>${student.level}</td>
        <td>
          <button onclick="editStudent('${docSnap.id}')">تعديل</button>
          <button class="del" onclick="deleteStudent('${docSnap.id}')">حذف</button>
        </td>
      </tr>
    `;
  });
}



// ===== التصفية حسب المستوى =====
document.getElementById("levelFilter").addEventListener("change", (e) => {
  loadStudents(e.target.value);
});



// ===== حذف طالب =====
window.deleteStudent = async function (id) {
  if (!confirm("هل أنت متأكد من حذف هذا الطالب؟")) return;

  await deleteDoc(doc(db, "students", id));
  loadStudents();
};



// ===== تعديل طالب =====
window.editStudent = function (id) {
  window.location.href = `editStudent.html?id=${id}`;
};
