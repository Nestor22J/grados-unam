/**
 * School Management Script
 */
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadSchools();
    setupEventListeners();
});

// State
let schools = [];

// DOM Elements
const elements = {
    container: document.getElementById('schools-container'),
    modalOverlay: document.getElementById('modal-overlay'),
    form: document.getElementById('school-form'),
    inputName: document.getElementById('school-name'),
    inputFaculty: document.getElementById('school-faculty'),
    inputCode: document.getElementById('school-code'), 
    inputUser: document.getElementById('school-user'), // New
    inputPass: document.getElementById('school-pass'), // New
    inputIndex: document.getElementById('school-index'),
    btnAdd: document.getElementById('btn-add-school'),
    btnClose: document.getElementById('modal-close'),
    btnCancel: document.getElementById('btn-cancel'),
    btnLogout: document.getElementById('btn-logout'),
    toast: document.getElementById('toast'),
    toastMsg: document.getElementById('toast-msg'),
    modalTitle: document.getElementById('modal-title'),
    userNameDisplay: document.getElementById('current-user-name'),
    searchInput: document.getElementById('search-school')
};

// ... Auth Logic (Unchanged) ...
function checkAuth() {
    const isAuth = localStorage.getItem('nexus_auth');
    if (!isAuth) {
        window.location.href = 'login.html';
        return;
    }
    const currentUser = JSON.parse(localStorage.getItem('nexus_current_user'));
    
    // Security Check
    if (!currentUser || currentUser.role !== 'admin') {
        window.location.href = 'index.html'; // Redirect if not admin
        return;
    }

    if (currentUser && elements.userNameDisplay) {
        elements.userNameDisplay.textContent = currentUser.name.replace(/\w\S*/g, (w) => (w.replace(/^\w/, (c) => c.toUpperCase())));
    }
}

// Data Handling
function loadSchools() {
    const data = localStorage.getItem('nexus_schools');
    if (data) {
        schools = JSON.parse(data);
    } else {
        // Default Seed with User/Pass
        schools = [
            { name: 'Ingeniería de Sistemas e Informática', faculty: 'Facultad de Ingeniería', code: 'EPISI', user: 'episi', pass: '123' },
            { name: 'Ingeniería Civil', faculty: 'Facultad de Ingeniería', code: 'EPIC', user: 'epic', pass: '123' },
            { name: 'Ingeniería de Minas', faculty: 'Facultad de Ingeniería', code: 'EPIM', user: 'epim', pass: '123' },
            { name: 'Ingeniería Agroindustrial', faculty: 'Facultad de Ingeniería', code: 'EPIAG', user: 'epiag', pass: '123' },
            { name: 'Ingeniería Ambiental', faculty: 'Facultad de Ingeniería', code: 'EPIAM', user: 'epiam', pass: '123' },
            { name: 'Gestión Pública y Desarrollo Social', faculty: 'Facultad de Ciencias Jurídicas', code: 'EPGP', user: 'epgp', pass: '123' }
        ];
        saveSchools();
    }
    render();
}

function saveSchools() {
    localStorage.setItem('nexus_schools', JSON.stringify(schools));
}

// Event Listeners
function setupEventListeners() {
    if (elements.btnAdd) {
        elements.btnAdd.addEventListener('click', () => {
            elements.inputIndex.value = '';
            elements.form.reset();
            elements.modalTitle.textContent = 'Nueva Escuela';
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
    const togglePassBtn = document.getElementById('toggle-school-pass');
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

    // Search
    if (elements.searchInput) elements.searchInput.addEventListener('input', render);
}

// Handlers
function handleFormSubmit(e) {
    e.preventDefault();
    
    const name = elements.inputName.value;
    const faculty = elements.inputFaculty.value;
    const code = elements.inputCode.value;
    const user = elements.inputUser.value;
    const pass = elements.inputPass.value;
    const index = elements.inputIndex.value;

    if (index !== '') {
        // Edit
        schools[index] = { ...schools[index], name, faculty, code, user, pass };
        showToast('Escuela actualizada');
    } else {
        // Create
        if (schools.some(s => s.code === code || s.user === user)) {
            alert('El código o usuario ya existe');
            return;
        }
        schools.push({ name, faculty, code, user, pass });
        showToast('Escuela registrada');
    }

    saveSchools();
    closeModal();
    render();
}

function deleteSchool(index) {
    if(confirm('¿Seguro que deseas eliminar esta escuela?')) {
        schools.splice(index, 1);
        saveSchools();
        render();
        showToast('Escuela eliminada');
    }
}

function editSchool(index) {
    const school = schools[index];
    elements.inputIndex.value = index;
    elements.inputName.value = school.name;
    elements.inputFaculty.value = school.faculty;
    elements.inputCode.value = school.code;
    elements.inputUser.value = school.user || '';
    elements.inputPass.value = school.pass || '';
    elements.modalTitle.textContent = 'Editar Escuela';
    openModal();
}

// UI
function render() {
    elements.container.innerHTML = '';
    
    let filtered = schools;

    // Filter by Search
    const term = elements.searchInput ? elements.searchInput.value.toLowerCase() : '';
    if (term) {
        filtered = filtered.filter(s => 
            s.name.toLowerCase().includes(term) || 
            s.faculty.toLowerCase().includes(term) || 
            s.code.toLowerCase().includes(term)
        );
    }

    if (filtered.length === 0) {
        elements.container.innerHTML = `
            <div style="text-align: center; color: #666; padding: 2rem;">
                <i class="ri-building-2-line" style="font-size: 3rem; color: #ccc;"></i>
                <p>No hay escuelas registradas.</p>
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
                <th>Nombre de la Escuela</th>
                <th>Facultad</th>
                <th>Código/Usuario</th>
                <th>Acciones</th>
            </tr>
        </thead>
        <tbody></tbody>
    `;

    const tbody = table.querySelector('tbody');

    filtered.forEach((school, index) => {
        const realIndex = schools.indexOf(school);

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="font-weight: 500;">
                ${escapeHtml(school.name)}
            </td>
            <td>${escapeHtml(school.faculty)}</td>
            <td>
                <span class="card-badge badge-design" style="font-size: 0.8rem; background: #e3f2fd; color: #1565c0;">${escapeHtml(school.code)}</span>
                <div style="font-size:0.75rem; color:#666; margin-top:4px;">${escapeHtml(school.user || '')}</div>
            </td>
            <td>
                <button class="action-btn edit" onclick="editSchool(${realIndex})" title="Editar">
                    <i class="ri-edit-line"></i>
                </button>
                <button class="action-btn delete" onclick="deleteSchool(${realIndex})" title="Eliminar">
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
        if(elements.inputPass) elements.inputPass.type = 'password';
        const icon = document.getElementById('toggle-school-pass');
        if (icon) {
            icon.classList.remove('ri-eye-off-line');
            icon.classList.add('ri-eye-line');
        }
    }, 300);
}

function showToast(msg) {
    elements.toastMsg.textContent = msg;
    elements.toast.classList.remove('hidden');
    void elements.toast.offsetWidth;
    elements.toast.classList.add('show');
    setTimeout(() => {
        elements.toast.classList.remove('show');
        setTimeout(() => elements.toast.classList.add('hidden'), 300);
    }, 3000);
}

function escapeHtml(unsafe) {
    return unsafe.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

// Globals
window.editSchool = editSchool;
window.deleteSchool = deleteSchool;

