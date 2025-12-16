/**
 * Notification Logic
 * Differentiated by User Role
 */
document.addEventListener('DOMContentLoaded', () => {
    setupNotifications();
});

// Default States
const defaultAdminNotifs = [
    { id: 1, type: 'info', text: 'Bienvenido al <strong>Panel de Control</strong>. El sistema está actualizado.', time: 'Hace 1 min', read: false },
    { id: 2, type: 'warning', text: 'Reporte: <strong>3 intentos fallidos</strong> de acceso detectados.', time: 'Hace 2 horas', read: false },
    { id: 3, type: 'success', text: 'Copia de seguridad del sistema completada con éxito.', time: 'Ayer', read: true }
];

const defaultStudentNotifs = [
    { id: 1, type: 'info', text: 'Nuevo material en: <strong>Ingeniería de Software</strong>', time: 'Hace 10 min', read: false },
    { id: 2, type: 'success', text: 'Tu tarea de <strong>Matemáticas</strong> fue calificada: 18/20.', time: 'Hace 1 hora', read: false },
    { id: 3, type: 'warning', text: 'Recordatorio: Examen de <strong>Física</strong> mañana a las 8:00 AM.', time: 'Hace 3 horas', read: true }
];

// State Management
let notifications = [];
let storageKey = 'nexus_notifications_general'; // Fallback

function loadNotifications() {
    const userJson = localStorage.getItem('nexus_current_user');
    let role = 'student'; // Default
    if (userJson) {
        const user = JSON.parse(userJson);
        if (user.role) role = user.role;
    }

    // Set Key and Defaults based on Role
    if (role === 'admin') {
        storageKey = 'nexus_notifications_admin';
        const stored = localStorage.getItem(storageKey);
        notifications = stored ? JSON.parse(stored) : defaultAdminNotifs;
    } else {
        storageKey = 'nexus_notifications_student';
        const stored = localStorage.getItem(storageKey);
        notifications = stored ? JSON.parse(stored) : defaultStudentNotifs;
    }
    
    // Initial save if empty (to persist defaults first time)
    if (!localStorage.getItem(storageKey)) {
        saveNotifications();
    }
}

function saveNotifications() {
    localStorage.setItem(storageKey, JSON.stringify(notifications));
}

function setupNotifications() {
    loadNotifications();

    const btn = document.getElementById('btn-notifications');
    const dropdown = document.getElementById('notification-dropdown');
    const list = document.getElementById('notif-list');
    const badge = document.querySelector('.badge-count');
    const filterAll = document.getElementById('filter-all');
    const filterUnread = document.getElementById('filter-unread');

    if (btn && dropdown) {
        // Toggle Dropdown
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('hidden');
        });

        // Close on Click Outside
        document.addEventListener('click', (e) => {
            if (!dropdown.contains(e.target) && e.target !== btn) {
                dropdown.classList.add('hidden');
            }
        });
    }

    // Initial Render
    if (list) {
        renderNotifications(notifications, list);
        updateBadge(badge);
    }

    // Filter Logic
    if (filterAll && filterUnread && list) {
        filterAll.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent closing dropdown
            filterAll.classList.add('active');
            filterUnread.classList.remove('active');
            renderNotifications(notifications, list);
        });

        filterUnread.addEventListener('click', (e) => {
            e.stopPropagation();
            filterUnread.classList.add('active');
            filterAll.classList.remove('active');
            const unread = notifications.filter(n => !n.read);
            renderNotifications(unread, list);
        });
    }
}

function renderNotifications(items, container) {
    container.innerHTML = '';
    
    if (items.length === 0) {
        container.innerHTML = '<div style="padding: 20px; text-align: center; color: #999;">No hay notificaciones</div>';
        return;
    }

    items.forEach(item => {
        const div = document.createElement('div');
        div.className = `notif-item ${item.read ? '' : 'unread'}`;
        div.onclick = () => markAsRead(item.id); 
        
        div.innerHTML = `
            <div class="notif-avatar ${item.type}">
                <i class="${getIcon(item.type)}"></i>
            </div>
            <div class="notif-content">
                <p class="notif-text">${item.text}</p>
                <span class="notif-time">${item.time}</span>
            </div>
            ${!item.read ? '<div style="width: 8px; height: 8px; background: #2196f3; border-radius: 50%; align-self: center;"></div>' : ''}
        `;
        container.appendChild(div);
    });
}

function markAsRead(id) {
    const notif = notifications.find(n => n.id === id);
    if (notif && !notif.read) {
        notif.read = true;
        saveNotifications();
        
        // Re-render keeping filter state
        const filterUnread = document.getElementById('filter-unread');
        const list = document.getElementById('notif-list');
        const badge = document.querySelector('.badge-count');
        
        if (filterUnread && filterUnread.classList.contains('active')) {
             const unread = notifications.filter(n => !n.read);
             renderNotifications(unread, list);
        } else {
             renderNotifications(notifications, list);
        }
        updateBadge(badge);
    }
}

function getIcon(type) {
    if (type === 'info') return 'ri-information-line';
    if (type === 'success') return 'ri-checkbox-circle-line';
    if (type === 'warning') return 'ri-alert-line';
    return 'ri-notification-line';
}

function updateBadge(badge) {
    if (!badge) return;
    const count = notifications.filter(n => !n.read).length;
    if (count > 0) {
        badge.textContent = count;
        badge.style.display = 'block';
    } else {
        badge.style.display = 'none';
    }
}
function markAsRead(id) {
    const notif = notifications.find(n => n.id === id);
    if (notif && !notif.read) {
        notif.read = true;
        saveNotifications();
        
        // Re-render current view (simple reload of render logic)
        // We need to know current filter, but for simplicity let's just re-render all for now or check active filter
        const filterUnread = document.getElementById('filter-unread');
        const list = document.getElementById('notif-list');
        const badge = document.querySelector('.badge-count');
        
        if (filterUnread && filterUnread.classList.contains('active')) {
             const unread = notifications.filter(n => !n.read);
             renderNotifications(unread, list);
        } else {
             renderNotifications(notifications, list);
        }
        updateBadge(badge);
    }
}

function getIcon(type) {
    if (type === 'info') return 'ri-information-line';
    if (type === 'success') return 'ri-checkbox-circle-line';
    if (type === 'warning') return 'ri-alert-line';
    return 'ri-notification-line';
}

function updateBadge(badge) {
    if (!badge) return;
    const count = notifications.filter(n => !n.read).length;
    if (count > 0) {
        badge.textContent = count;
        badge.style.display = 'block';
    } else {
        badge.style.display = 'none';
    }
}

