/**
 * School Logic
 * Handles viewing and managing requests for School users.
 */

document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;
    
    // Logic for school-requests.html
    if (path.includes('school-requests.html')) {
        checkSchoolAuth();
        initSchoolLogic();
    }
});

function checkSchoolAuth() {
    const currentUser = JSON.parse(localStorage.getItem('nexus_current_user'));
    if (!currentUser || currentUser.role !== 'school') {
        // If not school, redirect (allow admin generic view maybe, but primarily for schools)
        if(currentUser.role !== 'admin') window.location.href = 'index.html';
    }
}

// Global state for requests loaded
let currentRequests = [];
let currentObsId = null; // ID of request being observed

// Navigation variables (initialized later)
let mainView, applicantsView, backBtn;

function initSchoolLogic() {
    mainView = document.getElementById('main-dashboard-view');
    applicantsView = document.getElementById('applicants-view');
    backBtn = document.getElementById('btn-back-dashboard');

    if(backBtn) {
        backBtn.addEventListener('click', () => {
            applicantsView.classList.add('hidden');
            mainView.classList.remove('hidden');
        });
    }

    loadRequests();
}

function loadRequests() {
    // Load data
    const allRequests = JSON.parse(localStorage.getItem('nexus_requests')) || [];
    const currentUser = JSON.parse(localStorage.getItem('nexus_current_user'));

    if (currentUser && currentUser.role === 'school') {
        // Filter by school name
        // We accept a match if the school name contains the request school or vice versa (case insensitive)
        const schoolName = (currentUser.name || '').toLowerCase();
        
        currentRequests = allRequests.filter(req => {
            const reqSchool = (req.school || '').toLowerCase();
            return schoolName.includes(reqSchool) || reqSchool.includes(schoolName);
        });
    } else {
        // Admin or others see all
        currentRequests = allRequests;
    }

    renderDashboard();
}

// State for filtered view
let currentFilterType = 'Inicio de Trámite';

function renderDashboard() {
    if(!mainView) return;
    mainView.innerHTML = '';
    mainView.style.display = 'grid'; // Ensure grid layout for multiple cards
    mainView.style.gridTemplateColumns = 'repeat(auto-fill, minmax(350px, 1fr))';
    mainView.style.gap = '20px';

    // Defined types we want to show as "Folders"
    const types = [
        { id: 'Inicio de Trámite', label: 'Solicitud de Inicio de Trámite', desc: 'Solicitud formal para iniciar el proceso de Grados y Títulos.', icon: 'ri-file-text-line' },
        { id: 'Designación de Asesor', label: 'Designación de Asesor', desc: 'Solicitudes para designación o propuesta de asesor de tesis.', icon: 'ri-user-star-line' }
    ];

    types.forEach(typeObj => {
        const totalPending = currentRequests.filter(r => r.status === 'pending' && r.type === typeObj.id).length;
        
        const card = document.createElement('div');
        card.className = 'card';
        card.style.cursor = 'pointer';
        card.style.borderLeft = `4px solid ${typeObj.id === 'Inicio de Trámite' ? '#1a237e' : '#00695c'}`; 

        let badgeColor = typeObj.id === 'Inicio de Trámite' ? '' : 'background: #e0f2f1; color: #00695c;';

        card.innerHTML = `
            <div class="card-header">
                <span class="card-badge badge-design" style="${badgeColor}">Trámite</span>
                <i class="${typeObj.icon}" style="color: #ccc; font-size: 1.2rem;"></i>
            </div>
            <h3 class="card-title">${typeObj.label}</h3>
            <p class="card-desc">
                ${typeObj.desc}
            </p>
            <div class="card-footer">
                <div class="status-indicator">
                    <span class="status-dot" style="background: ${totalPending > 0 ? '#f57c00' : '#2e7d32'};"></span>
                    <span>${totalPending > 0 ? totalPending + ' Solicitudes Pendientes' : 'Al día'}</span>
                </div>
                <button class="btn-primary" style="padding: 6px 12px; font-size: 0.8rem;">
                    Ver Solicitantes
                </button>
            </div>
        `;

        card.addEventListener('click', () => {
            showApplicantsList(typeObj.id);
        });

        mainView.appendChild(card);
    });
}

function showApplicantsList(type) {
    currentFilterType = type;
    mainView.classList.add('hidden');
    applicantsView.classList.remove('hidden');
    
    // Update title
    const title = document.getElementById('list-title');
    if(title) title.textContent = `Solicitantes - ${type}`;

    renderApplicantsTable();
}

function renderApplicantsTable() {
    const container = document.getElementById('applicants-list-container');
    if(!container) return;
    
    // Filter by type
    const list = currentRequests
        .filter(r => r.type === currentFilterType)
        .sort((a,b) => new Date(b.date) - new Date(a.date));

    if(list.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; color: #666; padding: 3rem;">
                <i class="ri-file-list-2-line" style="font-size: 3rem; color: #ddd;"></i>
                <p>No hay solicitudes registradas de este tipo.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = '';
    
    // Grid container
    const gridDiv = document.createElement('div');
    gridDiv.className = 'content-grid';
    gridDiv.style.gridTemplateColumns = 'repeat(auto-fill, minmax(300px, 1fr))';
    container.appendChild(gridDiv);

    list.forEach(req => {
        // Status Badge
        let statusColor = '#ffd700'; // pending
        let statusText = 'Pendiente';
        
        if(req.status === 'approved') { statusColor = '#2e7d32'; statusText = 'Apto'; }
        if(req.status === 'observed') { statusColor = '#c62828'; statusText = 'Observado'; }
        
        const card = document.createElement('div');
        card.className = 'card';
        card.style.cursor = 'default'; 
        card.style.borderLeft = `4px solid ${currentFilterType === 'Inicio de Trámite' ? '#1a237e' : '#00695c'}`; 

        card.innerHTML = `
            <div class="card-header">
                <span class="card-badge badge-design" style="${currentFilterType === 'Inicio de Trámite' ? '' : 'background: #e0f2f1; color: #00695c;'}">Trámite</span>
                <i class="ri-user-line" style="color: #ccc;"></i>
            </div>
            <h3 class="card-title">${req.type || 'Solicitud'}</h3>
            <div class="card-desc">
                <p style="margin-bottom: 5px;"><strong>Estudiante:</strong> ${escapeHtml(req.studentName)}</p>
                <p style="font-size: 0.8rem; color: #666; margin-top: 0;">
                     Código: ${escapeHtml(req.studentCode || 'N/A')} &bull; ${new Date(req.date).toLocaleDateString()}
                </p>
            </div>
            <div class="card-footer">
                <div class="status-indicator">
                    <span class="status-dot" style="background: ${statusColor};"></span>
                    <span>${statusText}</span>
                </div>
                <button class="btn-primary" style="padding: 6px 12px; font-size: 0.8rem;" onclick="openRequestDetail('${req.id}')">
                    Revisar
                </button>
            </div>
        `;
        
        gridDiv.appendChild(card);
    });
}

function openRequestDetail(id) {
    const req = currentRequests.find(r => r.id === id);
    if(!req) return;

    currentObsId = id; 

    // Populate FUT Modal
    const modal = document.getElementById('fut-modal-overlay');
    
    // I. Solicito & Content Customization
    const solicito = document.getElementById('fut-solicito');
    
    // Reset any injected specific fields if we were to handle them dynamically, 
    // but here we just set values on the fixed FUT structure.
    
    // Handle Advisor Designate Checkbox if it existed in the school modal (it doesn't yet, so we just show text)
    // We might need to inject a field to show this info since the school view uses the same or similar ID structure?
    // Actually school uses a simplified FUT view in the modal. Let's see what IDs exist.
    // The previous view_code_item for school-requests.html isn't available but we can infer from school-logic.js
    
    if(req.type === 'Inicio de Trámite') {
        if(solicito) solicito.value = "SOLICITUD DE INICIO DE TRÁMITE DE GRADOS Y TÍTULOS";
    } else if (req.type === 'Designación de Asesor') {
        if(solicito) solicito.value = "SOLICITUD DE DESIGNACIÓN / PROPUESTA DE ASESOR DE TESIS";
        // Append extra info to Solicito for visibility if we lack fields
        if(req.details && req.details.schoolDesignates) {
             if(solicito) solicito.value += "\n(SOLICITA DESIGNACIÓN POR LA ESCUELA)";
        }
    }
    
    // II. Dependencia
    const dep = document.getElementById('fut-dependencia');
    if(dep) dep.value = `DIRECTOR DE LA ESCUELA DE ${req.school ? req.school.toUpperCase() : 'INGENIERÍA'}`;

    // IV. Persona data
    const names = (req.studentName || '').split(' ');
    let paterno = '', materno = '', nombres = '';
    if(names.length >= 3) {
        paterno = names[0]; materno = names[1]; nombres = names.slice(2).join(' ');
    } else {
        paterno = names[0]; nombres = names.slice(1).join(' ');
    }

    if(document.getElementById('fut-paterno')) document.getElementById('fut-paterno').value = paterno;
    if(document.getElementById('fut-materno')) document.getElementById('fut-materno').value = materno;
    if(document.getElementById('fut-nombres')) document.getElementById('fut-nombres').value = nombres;
    if(document.getElementById('fut-dni')) document.getElementById('fut-dni').value = req.studentCode || '';

    // Show Modal
    if(modal) {
        modal.classList.remove('hidden');
        void modal.offsetWidth;
        modal.classList.add('show');
    }
}

// Modal Actions Logic
const futClose = document.getElementById('fut-modal-close');
const btnApprove = document.getElementById('btn-modal-approve');
const btnObserve = document.getElementById('btn-modal-observe');

if(futClose) futClose.addEventListener('click', () => {
    document.getElementById('fut-modal-overlay').classList.remove('show');
    setTimeout(() => document.getElementById('fut-modal-overlay').classList.add('hidden'), 300);
});

if(btnApprove) {
    btnApprove.addEventListener('click', () => {
        const req = currentRequests.find(r => r.id === currentObsId);
        if(!req) return;

        // Custom Logic for Designation
        // Only open designation modal if the STUDENT REQUESTED IT (schoolDesignates === true)
        if(req.type === 'Designación de Asesor' && req.details && req.details.schoolDesignates) {
            document.getElementById('fut-modal-overlay').classList.remove('show');
            document.getElementById('fut-modal-overlay').classList.add('hidden');
            openDesignationModal(req);
        } else {
             // Standard Approve (Applies to 'Inicio de Trámite' AND 'Designación de Asesor' where student proposed)
             document.getElementById('fut-modal-overlay').classList.remove('show');
             document.getElementById('fut-modal-overlay').classList.add('hidden'); 
             approveRequest(currentObsId);
        }
    });
}

if(btnObserve) {
     btnObserve.addEventListener('click', () => {
         // Close detail modal and open obs modal
         document.getElementById('fut-modal-overlay').classList.remove('show');
         document.getElementById('fut-modal-overlay').classList.add('hidden');
         openObsModal(currentObsId);
    });
}

function approveRequest(id) {
    if(!confirm('¿Está seguro de APROBAR esta solicitud?')) return;

    const index = currentRequests.findIndex(r => r.id === id);
    if(index !== -1) {
        currentRequests[index].status = 'approved';
        currentRequests[index].updatedAt = new Date().toISOString();
        saveRequests();
        loadRequests();
        showToast('Solicitud Aprobada');
    }
}

// Designation Modal Logic
const desModal = document.getElementById('designation-modal-overlay');
const desClose = document.getElementById('designation-modal-close');
const desCancel = document.getElementById('btn-des-cancel');
const desSubmit = document.getElementById('btn-des-submit');

function openDesignationModal(req) {
    // Populate Student
    document.getElementById('des-student').value = req.studentName || 'Estudiante';
    // Clear Topic
    document.getElementById('des-topic').value = '';
    
    // Load Advisors
    const advisors = JSON.parse(localStorage.getItem('nexus_advisors')) || [];
    const select = document.getElementById('des-advisor-select');
    select.innerHTML = '<option value="">-- Seleccionar Docente --</option>';
    
    advisors.forEach(adv => {
        const option = document.createElement('option');
        option.value = adv.id || adv.user; // Use user as ID if id missing
        option.textContent = adv.name;
        select.appendChild(option);
    });

    if(desModal) {
        desModal.classList.remove('hidden');
        void desModal.offsetWidth;
        desModal.classList.add('show');
    }
}

const closeDesignationModal = () => {
    if(desModal) {
        desModal.classList.remove('show');
        setTimeout(() => desModal.classList.add('hidden'), 300);
    }
};

if(desClose) desClose.addEventListener('click', closeDesignationModal);
if(desCancel) desCancel.addEventListener('click', closeDesignationModal);

if(desSubmit) {
    desSubmit.addEventListener('click', () => {
        const advisorId = document.getElementById('des-advisor-select').value;
        const topic = document.getElementById('des-topic').value;
        
        if(!advisorId) { alert('Seleccione un asesor'); return; }
        if(!topic.trim()) { alert('Ingrese el tema del proyecto'); return; }

        // Find Request
        const index = currentRequests.findIndex(r => r.id === currentObsId);
        if(index !== -1) {
            // Update Request Status
            currentRequests[index].status = 'approved'; // Mark as approved/processed for School
            currentRequests[index].updatedAt = new Date().toISOString();
            
            // Save Designation Details
            currentRequests[index].designation = {
                advisorId: advisorId,
                topic: topic,
                date: new Date().toISOString()
            };

            // TODO: Create Notification/Request for Advisor here if we had Advisor Requests table
            // const advisorRequests = JSON.parse(localStorage.getItem('nexus_advisor_requests')) || [];
            // advisorRequests.push({...});
            // localStorage.setItem...

            saveRequests();
            loadRequests();
            closeDesignationModal();
            showToast('Carta enviada y Asesor designado');
        }
    });
}

function openObsModal(id) {
    currentObsId = id;
    const modal = document.getElementById('obs-modal-overlay');
    const text = document.getElementById('obs-text');
    if(text) text.value = '';
    if(modal) {
        modal.classList.remove('hidden');
        void modal.offsetWidth;
        modal.classList.add('show');
    }
}

// Setup Modal Events
const obsModal = document.getElementById('obs-modal-overlay');
const closeBtn = document.getElementById('obs-modal-close');
const cancelBtn = document.getElementById('btn-obs-cancel');
const submitBtn = document.getElementById('btn-obs-submit');

const closeObsModal = () => {
    if(obsModal) {
        obsModal.classList.remove('show');
        setTimeout(() => obsModal.classList.add('hidden'), 300);
    }
    currentObsId = null;
};

if(closeBtn) closeBtn.addEventListener('click', closeObsModal);
if(cancelBtn) cancelBtn.addEventListener('click', closeObsModal);

if(submitBtn) {
    submitBtn.addEventListener('click', () => {
        const text = document.getElementById('obs-text').value;
        if(!text.trim()) {
            alert('Ingrese una observación');
            return;
        }

        const index = currentRequests.findIndex(r => r.id === currentObsId);
        if(index !== -1) {
            currentRequests[index].status = 'observed';
            currentRequests[index].observation = text;
            currentRequests[index].updatedAt = new Date().toISOString();
            saveRequests();
            loadRequests();
            showToast('Observación registrada');
            closeObsModal();
        }
    });
}

function saveRequests() {
    localStorage.setItem('nexus_requests', JSON.stringify(currentRequests));
}

function escapeHtml(unsafe) {
    if(!unsafe) return '';
    return unsafe.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

function showToast(msg) {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toast-msg');
    if(toast && toastMsg) {
        toastMsg.textContent = msg;
        toast.classList.remove('hidden');
        void toast.offsetWidth;
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.classList.add('hidden'), 300);
        }, 3000);
    }
}

// Expose global functions
window.approveRequest = approveRequest;
window.openObsModal = openObsModal;
window.openDesignationModal = openDesignationModal;

