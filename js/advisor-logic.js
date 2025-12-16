/**
 * Advisor Logic - Handles Advisor specific features
 * - Availability Toggle
 */

document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;
    const currentUser = JSON.parse(localStorage.getItem('nexus_current_user'));

    // Check if on Status Page and user is Advisor
    if (path.includes('advisor-status.html')) {
         if (!currentUser || currentUser.role !== 'advisor') {
            // keep it accessible or redirect?
            if(!currentUser) window.location.href = 'login.html';
         }
         initAdvisorDashboard(currentUser);
    }
});

function initAdvisorDashboard(user) {
    const container = document.getElementById('availability-panel-container');
    if (!container) return;

    // Find the Advisors list in localStorage to get current status
    // The user object in localStorage might be stale if we only update the list
    // We should re-fetch from the list to be sure.
    const advisors = JSON.parse(localStorage.getItem('nexus_advisors')) || [];
    const currentAdvisorIndex = advisors.findIndex(a => a.user === user.user);
    
    // Default to 'active' if not set
    let currentStatus = 'active';
    if (currentAdvisorIndex !== -1) {
        currentStatus = advisors[currentAdvisorIndex].status || 'active';
    }

    // Create the Availability Card
    container.innerHTML = `
        <div class="crud-header">
            <div class="crud-title">
                <i class="ri-toggle-line"></i>
                <span>Mi Disponibilidad</span>
            </div>
        </div>
        
        <div class="card" style="padding: 2rem; display: flex; align-items: center; justify-content: space-between; max-width: 600px;">
            <div>
                <h3 style="margin-bottom: 0.5rem;">Estado Actual</h3>
                <p id="status-text" style="color: #666;">
                    ${currentStatus === 'active' ? 'Estás visible para los estudiantes como <strong>Disponible</strong>.' : 'No aparecerás como disponible para nuevas asesorías.'}
                </p>
            </div>
            
            <div class="toggle-wrapper" style="display: flex; align-items: center;">
                <label class="switch">
                    <input type="checkbox" id="availability-toggle" ${currentStatus === 'active' ? 'checked' : ''}>
                    <span class="slider round"></span>
                </label>
                <span id="status-label" style="display: inline-block; width: 100px; margin-left: 15px; font-weight: 600; color: ${currentStatus === 'active' ? '#2e7d32' : '#757575'};">
                    ${currentStatus === 'active' ? 'ACTIVO' : 'INACTIVO'}
                </span>
            </div>
        </div>

        <style>
            .switch { position: relative; display: inline-block; width: 60px; height: 34px; }
            .switch input { opacity: 0; width: 0; height: 0; }
            .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #ccc; transition: .4s; }
            .slider:before { position: absolute; content: ""; height: 26px; width: 26px; left: 4px; bottom: 4px; background-color: white; transition: .4s; }
            input:checked + .slider { background-color: #2e7d32; }
            input:focus + .slider { box-shadow: 0 0 1px #2e7d32; }
            input:checked + .slider:before { transform: translateX(26px); }
            .slider.round { border-radius: 34px; }
            .slider.round:before { border-radius: 50%; }
        </style>
    `;

    // Event Listener
    const toggle = document.getElementById('availability-toggle');
    toggle.addEventListener('change', (e) => {
        const isChecked = e.target.checked;
        const newStatus = isChecked ? 'active' : 'inactive';
        updateAdvisorStatus(user.user, newStatus);
    });
}

function updateAdvisorStatus(username, status) {
    const advisors = JSON.parse(localStorage.getItem('nexus_advisors')) || [];
    const index = advisors.findIndex(a => a.user === username);
    
    if (index !== -1) {
        advisors[index].status = status;
        localStorage.setItem('nexus_advisors', JSON.stringify(advisors));
        
        // Update UI Text
        const label = document.getElementById('status-label');
        const text = document.getElementById('status-text');
        
        if (status === 'active') {
            label.textContent = 'ACTIVO';
            label.style.color = '#2e7d32';
            text.innerHTML = 'Estás visible para los estudiantes como <strong>Disponible</strong>.';
        } else {
            label.textContent = 'INACTIVO';
            label.style.color = '#757575';
            text.innerHTML = 'No aparecerás como disponible para nuevas asesorías.';
        }

        // Show toast
        // Assuming showToast is global or we recreate it
        const toast = document.getElementById('toast');
        const toastMsg = document.getElementById('toast-msg');
        if (toast && toastMsg) {
            toastMsg.textContent = 'Estado actualizado';
            toast.classList.remove('hidden');
            void toast.offsetWidth;
            toast.classList.add('show');
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => toast.classList.add('hidden'), 300);
            }, 3000);
        }
    }
}

