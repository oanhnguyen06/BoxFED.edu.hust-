// ===== PAGINATION & LECTURER CARD =====
let currentPage = 1;
const itemsPerPage = 4;

function renderLecturers() {
  const grid = document.getElementById("lecturerGrid");
  grid.innerHTML = "";

  let start = (currentPage - 1) * itemsPerPage;
  let end = start + itemsPerPage;

  let list = lecturers.slice(start, end);

  if (list.length === 0) {
    grid.innerHTML = `<div class="empty">Không tìm thấy giảng viên nào…</div>`;
    return;
  }

  list.forEach(l => {
    grid.innerHTML += `
      <div class="card" data-key="${l.key}">
        <div class="card-top">
          <img src="${l.img}" class="card-img">
        </div>
        <div class="card-body">
          <h3 class="card-name"><a href="javascript:void(0)">${l.name}</a></h3>
          <p class="card-title">${l.title}</p>
          <p class="card-dept">${l.dept}</p>
        </div>
      </div>
    `;
  });

  attachCardEvents();
  renderPagination();
}

function attachCardEvents() {
  document.querySelectorAll('.card').forEach(card => {
    card.onclick = function () {
      openLecturer(card.getAttribute('data-key'));
    };
    card.querySelector('.card-img').onclick = function (e) { e.stopPropagation(); openLecturer(card.getAttribute('data-key')); };
    card.querySelector('.card-name a').onclick = function (e) { e.stopPropagation(); openLecturer(card.getAttribute('data-key')); };
  });
}

function renderPagination() {
  const totalPages = Math.ceil(lecturers.length / itemsPerPage);
  const pag = document.getElementById("pagination");

  pag.innerHTML = `
    <button class="page-btn" onclick="goPage(${currentPage - 1})" ${currentPage === 1 ? "disabled" : ""}>◀</button>
  `;

  for (let i = 1; i <= totalPages; i++) {
    pag.innerHTML += `
      <button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="goPage(${i})">${i}</button>
    `;
  }

  pag.innerHTML += `
    <button class="page-btn" onclick="goPage(${currentPage + 1})" ${currentPage === totalPages ? "disabled" : ""}>▶</button>
  `;
}

function goPage(p) {
  const totalPages = Math.ceil(lecturers.length / itemsPerPage);
  if (p < 1 || p > totalPages) return;
  currentPage = p;
  renderLecturers();
  document.querySelector('.container').scrollIntoView({ behavior: 'smooth' });
}

// ===== MODAL =====
function openLecturer(key) {
  const lec = lecturers.find(l => l.key === key);
  if (!lec) return;

  document.getElementById("modalBg").style.display = "block";
  document.getElementById("modalBox").style.display = "block";

  document.getElementById("modalImg").src = lec.img;
  document.getElementById("modalName").textContent = lec.name;
  document.getElementById("modalTitle").textContent = lec.title;
  document.getElementById("modalDept").textContent = lec.dept;

  const areaList = document.getElementById("modalSkills");
  areaList.innerHTML = "";
  if (lec.area) lec.area.forEach(a => { areaList.innerHTML += `<li>${a}</li>`; });

  const courseList = document.getElementById("modalCourses");
  courseList.innerHTML = "";
  const courses = lec.courses || lec.teach;
  if (courses) courses.forEach(c => { courseList.innerHTML += `<li>${c}</li>`; });

  const infoBox = document.getElementById("modalInfoExtra");
  if (infoBox) {
    infoBox.innerHTML = `
      <p><strong>Email:</strong> ${lec.email || "(đang cập nhật)"} </p>
      <p><strong>Điện thoại:</strong> ${lec.phone || "(đang cập nhật)"} </p>
      <p><strong>Văn phòng:</strong> ${lec.office || "(đang cập nhật)"} </p>
    `;
  }

  const trainList = document.getElementById("modalTrain");
  trainList.innerHTML = "";
  if (lec.train) lec.train.forEach(t => { trainList.innerHTML += `<li>${t}</li>`; });

  const workList = document.getElementById("modalWork");
  workList.innerHTML = "";
  if (lec.work) lec.work.forEach(w => { workList.innerHTML += `<li>${w}</li>`; });
}

document.getElementById("closeModal").onclick = closeModal;
document.getElementById("modalBg").onclick = closeModal;
function closeModal() {
  document.getElementById("modalBg").style.display = "none";
  document.getElementById("modalBox").style.display = "none";
}

// ===== SEARCH =====
document.getElementById("btnSearch").onclick = () => {
  const q = document.getElementById("searchBox").value.toLowerCase().trim();
  if (!q) {
    currentPage = 1;
    renderLecturers();
    return;
  }
  const filtered = lecturers.filter(l =>
    l.name.toLowerCase().includes(q) ||
    l.title.toLowerCase().includes(q) ||
    l.dept.toLowerCase().includes(q)
  );
  const grid = document.getElementById("lecturerGrid");
  grid.innerHTML = "";

  if (filtered.length === 0) {
    grid.innerHTML = `<div class="empty">Không tìm thấy giảng viên nào…</div>`;
    document.getElementById("pagination").innerHTML = "";
    return;
  }

  filtered.forEach(l => {
    grid.innerHTML += `
      <div class="card" data-key="${l.key}">
        <div class="card-top"><img src="${l.img}" class="card-img"></div>
        <div class="card-body">
          <h3 class="card-name"><a href="javascript:void(0)">${l.name}</a></h3>
          <p class="card-title">${l.title}</p>
          <p class="card-dept">${l.dept}</p>
        </div>
      </div>
    `;
  });

  attachCardEvents();
  document.getElementById("pagination").innerHTML = "";
};
document.getElementById("searchBox").addEventListener("keypress", function (e) {
  if (e.key === "Enter") document.getElementById("btnSearch").click();
});

// --- Chuẩn hoá tiếng Việt không dấu
function removeUnicode(str) {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

// ===== CHATBOT NGÀNH HỌC + GIẢNG VIÊN =====
let majors = {};
fetch("majors.json")
  .then(res => res.json())
  .then(data => majors = data);

const toggleChat = document.getElementById("toggleChat");
const chatBox = document.getElementById("chatBox");
const chatMessages = document.getElementById("chatMessages");
const chatInput = document.getElementById("chatInput");
const chatSend = document.getElementById("chatSend");
let hasGreeted = false;

toggleChat.onclick = () => {
  const isClosed = chatBox.style.display === "none";
  chatBox.style.display = isClosed ? "block" : "none";
  if (isClosed && !hasGreeted) {
    chatMessages.innerHTML = `<div class="msg bot">Chào bạn! Bạn cần tôi giúp gì không?</div>`;
    hasGreeted = true;
  }
};

chatSend.onclick = () => {
  let text = chatInput.value.trim();
  if (!text) return;
  chatMessages.innerHTML += `<div class="msg user">${text}</div>`;
  chatMessages.scrollTop = chatMessages.scrollHeight;
  chatInput.value = "";

  let reply = "Thông tin này không có trong chương trình đào tạo.";

  const qOrigin = text.toLowerCase();
  const q = removeUnicode(qOrigin);

  // --- Tìm ngành học trong majors.json ---
  Object.keys(majors).forEach(key => {
    const nganh = majors[key];
    const keyNorm = removeUnicode(key);
    const tenNorm = nganh.ten ? removeUnicode(nganh.ten) : "";
    // Tìm theo mã hoặc tên ngành (không dấu)
    if (q.includes(keyNorm) || (tenNorm && q.includes(tenNorm))) {
      reply =
        `<b>${nganh.ten}</b>:<br>${nganh.mo_ta}`;
      if (nganh.dinh_huong && Array.isArray(nganh.dinh_huong)) {
        reply += `<br><b>Định hướng:</b><ul>${nganh.dinh_huong.map(h => `<li>${h}</li>`).join("")}</ul>`;
      }
      if (nganh.muc_tieu && Array.isArray(nganh.muc_tieu)) {
        reply += `<br><b>Mục tiêu đào tạo:</b><ul>${nganh.muc_tieu.map(m => `<li>${m}</li>`).join("")}</ul>`;
      }
      if (nganh.nghe_nghiep && Array.isArray(nganh.nghe_nghiep)) {
        reply += `<br><b>Cơ hội nghề nghiệp:</b><ul>${nganh.nghe_nghiep.map(n => `<li>${n}</li>`).join("")}</ul>`;
      }
      if (nganh.xet_tuyen) {
        reply += `<br><b>Phương thức xét tuyển:</b><ul>`;
        if (nganh.xet_tuyen.thpt) reply += `<li>THPT: ${nganh.xet_tuyen.thpt.join(", ")}</li>`;
        if (nganh.xet_tuyen.khac) reply += `<li>Khác: ${nganh.xet_tuyen.khac.join(", ")}</li>`;
        reply += `</ul>`;
      }
    }
  });

  // --- Tìm thông tin giảng viên nếu chưa match ngành ---
  if (reply === "Thông tin này không có trong chương trình đào tạo.") {
    const foundLecturer = lecturers.find(l =>
      (l.name && q.includes(removeUnicode(l.name))) ||
      (l.key && q.includes(removeUnicode(l.key)))
    );
    if (foundLecturer) {
      reply = `<b>${foundLecturer.name}</b> (${foundLecturer.title})<br>
        <b>Khoa:</b> ${foundLecturer.dept}<br>
        <b>Email:</b> ${foundLecturer.email || "(đang cập nhật)"}<br>
        <b>Điện thoại:</b> ${foundLecturer.phone || "(đang cập nhật)"}<br>
        <b>Văn phòng:</b> ${foundLecturer.office || "(đang cập nhật)"}<br>
        <b>Chuyên môn:</b> ${(foundLecturer.area || []).join(", ") || "(đang cập nhật)"}`;
    }
  }

  chatMessages.innerHTML += `<div class="msg bot">${reply}</div>`;
  chatMessages.scrollTop = chatMessages.scrollHeight;
};
chatInput.addEventListener("keypress", e => {
  if (e.key === "Enter") chatSend.click();
});

// ===== INIT =====
renderLecturers();
