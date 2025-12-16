/**
 * Student Management Script
 */
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadStudents();
    setupEventListeners();
});

// State
let students = [];

// DOM Elements
const elements = {
    container: document.getElementById('students-container'),
    modalOverlay: document.getElementById('modal-overlay'),
    form: document.getElementById('student-form'),
    inputName: document.getElementById('student-name'),
    inputUser: document.getElementById('student-user'), 
    inputCareer: document.getElementById('student-career'), // Re-added
    inputPass: document.getElementById('student-pass'), 
    inputIndex: document.getElementById('student-index'),
    btnAdd: document.getElementById('btn-add-student'),
    btnClose: document.getElementById('modal-close'),
    btnCancel: document.getElementById('btn-cancel'),
    btnLogout: document.getElementById('btn-logout'),
    toast: document.getElementById('toast'),
    toastMsg: document.getElementById('toast-msg'),
    modalTitle: document.getElementById('modal-title'),
    userNameDisplay: document.getElementById('current-user-name'),
    searchInput: document.getElementById('search-student'), // New
    filterSelect: document.getElementById('filter-career')  // New
};

// Auth Logic
function checkAuth() {
    const isAuth = localStorage.getItem('nexus_auth');
    if (!isAuth) {
        window.location.href = 'login.html';
        return;
    }
    const currentUser = JSON.parse(localStorage.getItem('nexus_current_user'));
    
    // Security Check
    if (!currentUser || currentUser.role !== 'admin') {
        window.location.href = 'index.html'; // Redirect non-admins
        return;
    }

    if (currentUser && elements.userNameDisplay) {
        elements.userNameDisplay.textContent = currentUser.name;
    }
}

// Data Handling
function loadStudents() {
    const data = localStorage.getItem('nexus_students');
    if (data) {
        students = JSON.parse(data);
    } else {
        students = []; 
    }
    render();
}

function saveStudents() {
    localStorage.setItem('nexus_students', JSON.stringify(students));
}

// Event Listeners
function setupEventListeners() {
    if (elements.btnAdd) {
        elements.btnAdd.addEventListener('click', () => {
            elements.inputIndex.value = '';
            elements.form.reset();
            elements.modalTitle.textContent = 'Nuevo Estudiante';
            openModal();
        });
    }

    if (elements.btnClose) elements.btnClose.addEventListener('click', closeModal);
    if (elements.btnCancel) elements.btnCancel.addEventListener('click', closeModal);
    
    if (elements.modalOverlay) {
        elements.modalOverlay.addEventListener('click', (e) => {
            if (e.target === elements.modalOverlay) closeModal();
        });
    }

    if (elements.form) elements.form.addEventListener('submit', handleFormSubmit);

    // Logout
    if (elements.btnLogout) {
        elements.btnLogout.addEventListener('click', () => {
            localStorage.removeItem('nexus_auth');
            window.location.href = 'login.html';
        });
    }

    // Password Toggle
    const togglePassBtn = document.getElementById('toggle-student-pass');
    if (togglePassBtn) {
        togglePassBtn.addEventListener('click', function() {
            const passwordInput = elements.inputPass;
            const icon = this;
            
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                icon.classList.remove('ri-eye-line');
                icon.classList.add('ri-eye-off-line');
            } else {
                passwordInput.type = 'password';
                icon.classList.remove('ri-eye-off-line');
                icon.classList.add('ri-eye-line');
            }
        });
    }

    // Search & Filter
    if (elements.searchInput) elements.searchInput.addEventListener('input', render);
    if (elements.filterSelect) elements.filterSelect.addEventListener('change', render);
}

// Handlers
function handleFormSubmit(e) {
    e.preventDefault();
    
    const name = elements.inputName.value;
    const user = elements.inputUser.value;
    const career = elements.inputCareer.value; // Get value
    const pass = elements.inputPass.value; 
    const index = elements.inputIndex.value;

    if (index !== '') {
        // Edit
        students[index] = { ...students[index], name, user, career, pass };
        showToast('Estudiante actualizado');
    } else {
        // Create
        if (students.some(s => s.user === user)) {
            alert('El usuario ya existe');
            return;
        }
        students.push({ name, user, career, pass });
        showToast('Estudiante registrado');
    }

    saveStudents();
    closeModal();
    render();
}

function deleteStudent(index) {
    students.splice(index, 1);
    saveStudents();
    render();
    showToast('Estudiante eliminado');
}

function editStudent(index) {
    const student = students[index];
    elements.inputIndex.value = index;
    elements.inputName.value = student.name;
    elements.inputUser.value = student.user;
    elements.inputCareer.value = student.career; // Set value
    elements.inputPass.value = student.pass; 
    elements.modalTitle.textContent = 'Editar Estudiante';
    openModal();
}

// UI
function render() {
    elements.container.innerHTML = '';
    
    let filtered = students;

    // Filter by Search
    const term = elements.searchInput ? elements.searchInput.value.toLowerCase() : '';
    if (term) {
        filtered = filtered.filter(s => 
            s.name.toLowerCase().includes(term) || 
            s.user.toLowerCase().includes(term)
        );
    }

    // Filter by Career
    const careerFilter = elements.filterSelect ? elements.filterSelect.value : 'all';
    if (careerFilter !== 'all') {
        filtered = filtered.filter(s => s.career === careerFilter);
    }

    if (filtered.length === 0) {
        elements.container.innerHTML = `
            <div style="text-align: center; color: #666; padding: 2rem;">
                <i class="ri-user-search-line" style="font-size: 3rem; color: #ccc;"></i>
                <p>No se encontraron estudiantes.</p>
            </div>
        `;
        return;
    }

    // Render Table
    const table = document.createElement('table');
    table.className = 'student-table';
    table.innerHTML = `
        <thead>
            <tr>
                <th>Nombre</th>
                <th>Usuario / DNI</th>
                <th>Carrera</th>
                <th>Acciones</th>
            </tr>
        </thead>
        <tbody></tbody>
    `;

    const tbody = table.querySelector('tbody');

    filtered.forEach((student, index) => {
        // Warning: index here is index in filtered array, not main array. 
        // We need to find the real index or just use ID if we had one. 
        // For simplicity, let's look up index in original 'students' array.
        // Or better, let's map original array first or use a unique ID.
        // Since we don't have IDs, let's assume unique user field or just find indexObject.
        const realIndex = students.indexOf(student);

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="font-weight: 500;">${escapeHtml(student.name)}</td>
            <td>${escapeHtml(student.user)}</td>
            <td><span class="card-badge badge-design" style="font-size: 0.8rem;">${escapeHtml(student.career)}</span></td>
            <td>
                <button class="action-btn edit" onclick="editStudent(${realIndex})" title="Editar">
                    <i class="ri-edit-line"></i>
                </button>
                <button class="action-btn delete" onclick="deleteStudent(${realIndex})" title="Eliminar">
                    <i class="ri-delete-bin-line"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    elements.container.appendChild(table);
}

function openModal() {
    elements.modalOverlay.classList.remove('hidden');
    void elements.modalOverlay.offsetWidth;
    elements.modalOverlay.classList.add('show');
}

function closeModal() {
    elements.modalOverlay.classList.remove('show');
    setTimeout(() => {
        elements.modalOverlay.classList.add('hidden');
        // Reset Password
        if(elements.inputPass) elements.inputPass.type = 'password';
        const icon = document.getElementById('toggle-student-pass');
        if (icon) {
            icon.classList.remove('ri-eye-off-line');
            icon.classList.add('ri-eye-line');
        }
    }, 300);
}

function showToast(msg) {
    if (!elements.toast) return;
    elements.toastMsg.textContent = msg;
    elements.toast.classList.remove('hidden');
    void elements.toast.offsetWidth;
    elements.toast.classList.add('show');
    setTimeout(() => {
        elements.toast.classList.remove('show');
        setTimeout(() => elements.toast.classList.add('hidden'), 300);
    }, 3000);
}

// Helpers
function escapeHtml(unsafe) {
    return unsafe.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

// Global scope for onclicks
window.editStudent = editStudent;
window.deleteStudent = deleteStudent;

