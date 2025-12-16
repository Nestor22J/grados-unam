/**
 * Admin Management Script
 */
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadAdmins();
    setupEventListeners();
});
let admins = [];
const elements = {
    container: document.getElementById('admins-container'),
    modalOverlay: document.getElementById('modal-overlay'),
    form: document.getElementById('admin-form'),
    inputName: document.getElementById('admin-name'),
    inputUser: document.getElementById('admin-user'),
    inputPass: document.getElementById('admin-pass'),
    inputIndex: document.getElementById('admin-index'),
    btnAdd: document.getElementById('btn-add-admin'),
    btnClose: document.getElementById('modal-close'),
    btnCancel: document.getElementById('btn-cancel'),
    btnLogout: document.getElementById('btn-logout'),
    toast: document.getElementById('toast'),
    toastMsg: document.getElementById('toast-msg'),
    modalTitle: document.getElementById('modal-title'),
    userNameDisplay: document.getElementById('current-user-name'),
    searchInput: document.getElementById('search-admin') // New
};

function checkAuth() {
    const isAuth = localStorage.getItem('nexus_auth');
    if (!isAuth) {
        window.location.href = 'login.html';
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
function loadAdmins() {
    const data = localStorage.getItem('nexus_users');
    if (data) {
        admins = JSON.parse(data);
    } else {
        admins = [{user: 'admin', pass: 'admin123', name: 'Administrador Principal'}];
        localStorage.setItem('nexus_users', JSON.stringify(admins));
    }
    render();
}

function saveAdmins() {
    localStorage.setItem('nexus_users', JSON.stringify(admins));
}

function setupEventListeners() {
    if (elements.btnAdd) {
        elements.btnAdd.addEventListener('click', () => {
            elements.inputIndex.value = '';
            elements.form.reset();
            elements.modalTitle.textContent = 'Nuevo Administrador';
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
    const togglePassBtn = document.getElementById('toggle-admin-pass');
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
        admins[index] = { ...admins[index], name, user, pass };
        showToast('Administrador actualizado');
    } else {
        // Create (Check duplicates)
        if (admins.some(a => a.user === user)) {
            alert('El usuario ya existe'); // Simple alert for dupes
            return;
        }
        admins.push({ name, user, pass });
        showToast('Administrador creado');
    }

    saveAdmins();
    closeModal();
    render();
}

function deleteAdmin(index) {
    // Prevent deleting self (simplified check: if it's the only admin)
    if (admins.length <= 1) {
        alert('No se puede eliminar el último administrador.');
        return;
    }
    
    // Optional: Check if deleting logged in user
    // const currentUser = JSON.parse(localStorage.getItem('nexus_current_user'));
    // if (admins[index].user === currentUser.user) { alert('No puedes eliminar tu propia cuenta'); return; }

    admins.splice(index, 1);
    saveAdmins();
    render();
    showToast('Administrador eliminado');
}

function editAdmin(index) {
    const admin = admins[index];
    elements.inputIndex.value = index;
    elements.inputName.value = admin.name;
    elements.inputUser.value = admin.user;
    elements.inputPass.value = admin.pass;
    elements.modalTitle.textContent = 'Editar Administrador';
    openModal();
}

// UI
function render() {
    elements.container.innerHTML = '';
    
    let filtered = admins;
    const term = elements.searchInput ? elements.searchInput.value.toLowerCase() : '';
    
    if (term) {
        filtered = filtered.filter(a => 
            a.name.toLowerCase().includes(term) || 
            a.user.toLowerCase().includes(term)
        );
    }

    if (filtered.length === 0) {
        elements.container.innerHTML = `
            <div style="text-align: center; color: #666; padding: 2rem;">
                <i class="ri-user-search-line" style="font-size: 3rem; color: #ccc;"></i>
                <p>No se encontraron administradores.</p>
            </div>
        `;
        return;
    }

    // Render Table
    const table = document.createElement('table');
    table.className = 'student-table'; // Reuse table style
    table.innerHTML = `
        <thead>
            <tr>
                <th>Nombre</th>
                <th>Usuario</th>
                <th>Rol</th>
                <th>Acciones</th>
            </tr>
        </thead>
        <tbody></tbody>
    `;

    const tbody = table.querySelector('tbody');

    filtered.forEach((admin, index) => {
        // Map back to original index for edit/delete
        const realIndex = admins.indexOf(admin);

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="font-weight: 500;">${escapeHtml(admin.name)}</td>
            <td>${escapeHtml(admin.user)}</td>
            <td><span class="card-badge badge-dev" style="font-size: 0.8rem;">Admin</span></td>
            <td>
                <button class="action-btn edit" onclick="editAdmin(${realIndex})" title="Editar">
                    <i class="ri-edit-line"></i>
                </button>
                <button class="action-btn delete" onclick="deleteAdmin(${realIndex})" title="Eliminar">
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
        // Reset Password Visibility
        elements.inputPass.type = 'password';
        const icon = document.getElementById('toggle-admin-pass');
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

// Helpers
function escapeHtml(unsafe) {
    return unsafe.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

// Global scope for onclicks
window.editAdmin = editAdmin;
window.deleteAdmin = deleteAdmin;

