/**
 * Jury Management Script
 */
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadJuries();
    setupEventListeners();
});

// State
let juries = [];

// DOM Elements
const elements = {
    container: document.getElementById('jury-container'),
    modalOverlay: document.getElementById('modal-overlay'),
    form: document.getElementById('jury-form'),
    inputName: document.getElementById('jury-name'),
    inputUser: document.getElementById('jury-user'), 
    inputPass: document.getElementById('jury-pass'), 
    inputIndex: document.getElementById('jury-index'),
    btnAdd: document.getElementById('btn-add-jury'),
    btnClose: document.getElementById('modal-close'),
    btnCancel: document.getElementById('btn-cancel'),
    btnLogout: document.getElementById('btn-logout'),
    toast: document.getElementById('toast'),
    toastMsg: document.getElementById('toast-msg'),
    modalTitle: document.getElementById('modal-title'),
    userNameDisplay: document.getElementById('current-user-name'),
    searchInput: document.getElementById('search-jury')
};

// Auth Logic (Unchanged)
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

// Data Handling (Unchanged)
function loadJuries() {
    const data = localStorage.getItem('nexus_juries');
    if (data) {
        juries = JSON.parse(data);
    } else {
        juries = [];
    }
    render();
}

function saveJuries() {
    localStorage.setItem('nexus_juries', JSON.stringify(juries));
}

// Event Listeners (Unchanged)
function setupEventListeners() {
    if (elements.btnAdd) {
        elements.btnAdd.addEventListener('click', () => {
            elements.inputIndex.value = '';
            elements.form.reset();
            elements.modalTitle.textContent = 'Nuevo Jurado';
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
    const togglePassBtn = document.getElementById('toggle-jury-pass');
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
    const user = elements.inputUser.value;
    const pass = elements.inputPass.value; 
    const index = elements.inputIndex.value;

    if (index !== '') {
        // Edit
        juries[index] = { ...juries[index], name, user, pass };
        showToast('Jurado actualizado');
    } else {
        // Create
        if (juries.some(s => s.user === user)) {
            alert('El usuario ya existe');
            return;
        }
        juries.push({ name, user, pass });
        showToast('Jurado registrado');
    }

    saveJuries();
    closeModal();
    render();
}

function deleteJury(index) {
    if(confirm('¿Seguro que deseas eliminar a este jurado?')) {
        juries.splice(index, 1);
        saveJuries();
        render();
        showToast('Jurado eliminado');
    }
}

function editJury(index) {
    const jury = juries[index];
    elements.inputIndex.value = index;
    elements.inputName.value = jury.name;
    elements.inputUser.value = jury.user;
    elements.inputPass.value = jury.pass; 
    elements.modalTitle.textContent = 'Editar Jurado';
    openModal();
}

// UI
function render() {
    elements.container.innerHTML = '';
    
    let filtered = juries;

    // Filter by Search
    const term = elements.searchInput ? elements.searchInput.value.toLowerCase() : '';
    if (term) {
        filtered = filtered.filter(s => 
            s.name.toLowerCase().includes(term) || 
            s.user.toLowerCase().includes(term)
        );
    }

    if (filtered.length === 0) {
        elements.container.innerHTML = `
            <div style="text-align: center; color: #666; padding: 2rem;">
                <i class="ri-scales-3-line" style="font-size: 3rem; color: #ccc;"></i>
                <p>No hay jurados registrados.</p>
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
                <th>Usuario</th>
                <th>Roles</th>
                <th>Acciones</th>
            </tr>
        </thead>
        <tbody></tbody>
    `;

    const tbody = table.querySelector('tbody');

    filtered.forEach((jury, index) => {
        const realIndex = juries.indexOf(jury);

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="font-weight: 500;">
                ${escapeHtml(jury.name)}
            </td>
            <td>${escapeHtml(jury.user)}</td>
            <td><span class="card-badge badge-dev" style="font-size: 0.8rem; background: #fff3e0; color: #ef6c00;">Jurado</span></td>
            <td>
                <button class="action-btn edit" onclick="editJury(${realIndex})" title="Editar">
                    <i class="ri-edit-line"></i>
                </button>
                <button class="action-btn delete" onclick="deleteJury(${realIndex})" title="Eliminar">
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
        elements.inputPass.type = 'password';
        const icon = document.getElementById('toggle-jury-pass');
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
window.editJury = editJury;
window.deleteJury = deleteJury;

