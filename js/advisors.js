/**
 * Advisor Management Script
 */
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadAdvisors();
    setupEventListeners();
});

// State
let advisors = [];

// DOM Elements
const elements = {
    container: document.getElementById('advisors-container'),
    modalOverlay: document.getElementById('modal-overlay'),
    form: document.getElementById('advisor-form'),
    inputName: document.getElementById('advisor-name'),
    inputUser: document.getElementById('advisor-user'), 
    inputCareer: document.getElementById('advisor-career'), // New
    inputSpecialty: document.getElementById('advisor-specialty'), // New
    inputPass: document.getElementById('advisor-pass'), 
    inputIndex: document.getElementById('advisor-index'),
    btnAdd: document.getElementById('btn-add-advisor'),
    btnClose: document.getElementById('modal-close'),
    btnCancel: document.getElementById('btn-cancel'),
    btnLogout: document.getElementById('btn-logout'),
    toast: document.getElementById('toast'),
    toastMsg: document.getElementById('toast-msg'),
    modalTitle: document.getElementById('modal-title'),
    userNameDisplay: document.getElementById('current-user-name'),
    searchInput: document.getElementById('search-advisor'),
    filterAvailability: document.getElementById('filter-availability')
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
        window.location.href = 'index.html'; // Redirect if not admin
        return;
    }

    if (currentUser && elements.userNameDisplay) {
        elements.userNameDisplay.textContent = currentUser.name.replace(/\w\S*/g, (w) => (w.replace(/^\w/, (c) => c.toUpperCase())));
    }
}

// Data Handling
function loadAdvisors() {
    const data = localStorage.getItem('nexus_advisors');
    if (data) {
        advisors = JSON.parse(data);
    } else {
        advisors = [];
    }
    render();
}

function saveAdvisors() {
    localStorage.setItem('nexus_advisors', JSON.stringify(advisors));
}

// Event Listeners
function setupEventListeners() {
    if (elements.btnAdd) {
        elements.btnAdd.addEventListener('click', () => {
            elements.inputIndex.value = '';
            elements.form.reset();
            elements.modalTitle.textContent = 'Nuevo Asesor';
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
    const togglePassBtn = document.getElementById('toggle-advisor-pass');
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
    if (elements.filterAvailability) elements.filterAvailability.addEventListener('change', render);
}

// Handlers
function handleFormSubmit(e) {
    e.preventDefault();
    
    const name = elements.inputName.value;
    const user = elements.inputUser.value;
    const type = 'Asesor'; // Default to Asesor
    const career = elements.inputCareer.value; 
    const specialty = elements.inputSpecialty.value;
    const pass = elements.inputPass.value; 
    const index = elements.inputIndex.value;

    if (index !== '') {
        // Edit
        advisors[index] = { ...advisors[index], name, user, type, career, specialty, pass };
        showToast('Asesor actualizado');
    } else {
        // Create
        if (advisors.some(s => s.user === user)) {
            alert('El usuario ya existe');
            return;
        }
        advisors.push({ name, user, type, career, specialty, pass, status: 'active' }); // Default active
        showToast('Asesor registrado');
    }

    saveAdvisors();
    closeModal();
    render();
}

function deleteAdvisor(index) {
    if(confirm('¿Seguro que deseas eliminar a este asesor?')) {
        advisors.splice(index, 1);
        saveAdvisors();
        render();
        showToast('Asesor eliminado');
    }
}

function editAdvisor(index) {
    const advisor = advisors[index];
    elements.inputIndex.value = index;
    elements.inputName.value = advisor.name;
    elements.inputUser.value = advisor.user;
    elements.inputCareer.value = advisor.career || ''; 
    elements.inputSpecialty.value = advisor.specialty || ''; 
    elements.inputPass.value = advisor.pass; 
    elements.modalTitle.textContent = 'Editar Asesor';
    openModal();
}

// UI
function render() {
    elements.container.innerHTML = '';
    const currentUser = JSON.parse(localStorage.getItem('nexus_current_user'));
    const isAdmin = currentUser && currentUser.role === 'admin';
    
    let filtered = advisors;

    // Filter by Search
    const term = elements.searchInput ? elements.searchInput.value.toLowerCase() : '';
    if (term) {
        filtered = filtered.filter(s => 
            s.name.toLowerCase().includes(term) || 
            s.user.toLowerCase().includes(term)
        );
    }

    // Filter by Availability
    const availFilter = elements.filterAvailability ? elements.filterAvailability.value : 'all';
    if (availFilter !== 'all') {
        filtered = filtered.filter(s => {
            const status = s.status || 'active'; // Default active
            return status === availFilter;
        });
    }

    if (filtered.length === 0) {
        elements.container.innerHTML = `
            <div style="text-align: center; color: #666; padding: 2rem;">
                <i class="ri-user-search-line" style="font-size: 3rem; color: #ccc;"></i>
                <p>No hay asesores registrados.</p>
            </div>
        `;
        return;
    }

    // Render Table
    const table = document.createElement('table');
    table.className = 'student-table';
    
    // Header
    let theadHtml = `
            <tr>
                <th>Nombre</th>
                <th>Carrera / Especialidad</th>
                <th>Usuario</th>
                <th>Tipo</th>
    `;
    if (isAdmin) {
        theadHtml += `<th>Acciones</th>`;
    }
    theadHtml += `</tr>`;

    table.innerHTML = `<thead>${theadHtml}</thead><tbody></tbody>`;

    const tbody = table.querySelector('tbody');

    filtered.forEach((advisor, index) => {
        const realIndex = advisors.indexOf(advisor);

        const isActive = advisor.status === 'active' || advisor.status === undefined;
        const statusHtml = isActive 
            ? '<i class="ri-checkbox-circle-fill" style="color:#2e7d32;" title="Disponible"></i>' 
            : '<i class="ri-indeterminate-circle-fill" style="color:#757575;" title="No Disponible"></i>';

        const tr = document.createElement('tr');
        let trHtml = `
            <td style="font-weight: 500;">
                <div style="display:flex; align-items:center; gap:8px;">
                     ${statusHtml}
                     <span>${escapeHtml(advisor.name)}</span>
                </div>
            </td>
            <td>
                <div style="font-size: 0.85rem; font-weight: 600;">${escapeHtml(advisor.career || '-')}</div>
                <div style="font-size: 0.75rem; color: #666; margin-top: 2px;">${escapeHtml(advisor.specialty || 'Sin especialidad')}</div>
            </td>
            <td>${escapeHtml(advisor.user)}</td>
            <td><span class="card-badge badge-design" style="font-size: 0.8rem; background: #e0f2f1; color: #00695c;">${escapeHtml(advisor.type)}</span></td>
        `;

        if (isAdmin) {
            trHtml += `
            <td>
                <button class="action-btn edit" onclick="editAdvisor(${realIndex})" title="Editar">
                    <i class="ri-edit-line"></i>
                </button>
                <button class="action-btn delete" onclick="deleteAdvisor(${realIndex})" title="Eliminar">
                    <i class="ri-delete-bin-line"></i>
                </button>
            </td>
            `;
        }

        tr.innerHTML = trHtml;
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
        const icon = document.getElementById('toggle-advisor-pass');
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
window.editAdvisor = editAdvisor;
window.deleteAdvisor = deleteAdvisor;

