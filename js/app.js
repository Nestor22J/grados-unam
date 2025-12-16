/**
 * Dashboard Loader
 */
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    setupDashboard();
});

function checkAuth() {
    const isAuth = localStorage.getItem('nexus_auth');
    if (!isAuth) {
        window.location.href = 'login.html';
        return;
    }

    const currentUserData = localStorage.getItem('nexus_current_user');
    let currentUser = { name: 'Administrador' }; // Default
    
    if (currentUserData) {
        currentUser = JSON.parse(currentUserData);
    }

    // Update UI with User Name
    const welcomeName = document.getElementById('welcome-user-name');
    const navName = document.getElementById('current-user-name'); // In header
    
    // Role based UI
    let roleStr = 'Estudiante';
    if (currentUser.role === 'admin') roleStr = 'Administrador';
    if (currentUser.role === 'advisor') roleStr = currentUser.type || 'Asesor';
    if (currentUser.role === 'jury') roleStr = 'Jurado';
    if (currentUser.role === 'school') roleStr = 'Escuela Profesional';

    const finalName = currentUser.name || roleStr;

    if (welcomeName) {
        // Format Name (Title Case)
        welcomeName.textContent = finalName.replace(/\w\S*/g, (w) => (w.replace(/^\w/, (c) => c.toUpperCase())));
        
        const welcomeTitle = document.querySelector('.welcome-user h2');
        if (welcomeTitle) {
            if (currentUser.role === 'admin') welcomeTitle.textContent = 'Bienvenido al Panel de Control';
            else if (currentUser.role === 'advisor') welcomeTitle.textContent = 'Bienvenido al Panel de Asesores';
            else if (currentUser.role === 'jury') welcomeTitle.textContent = 'Bienvenido al Panel de Jurados';
            else if (currentUser.role === 'school') welcomeTitle.textContent = 'Bienvenido al Panel de Escuela';
            else welcomeTitle.textContent = 'Bienvenido al Panel de Estudiantes/Egresados';
        }
        
        const welcomeIcon = document.querySelector('.welcome-image i');
        if (welcomeIcon) {
            if (currentUser.role === 'admin') welcomeIcon.className = 'ri-admin-line';
            else if (currentUser.role === 'advisor') welcomeIcon.className = 'ri-user-star-line';
            else if (currentUser.role === 'jury') welcomeIcon.className = 'ri-scales-3-line';
            else if (currentUser.role === 'school') welcomeIcon.className = 'ri-building-2-line';
            else welcomeIcon.className = 'ri-user-smile-line';
        }
    }
    if (navName) navName.textContent = finalName.replace(/\w\S*/g, (w) => (w.replace(/^\w/, (c) => c.toUpperCase())));

    // Permissions Logic - Global
    const allNavItems = document.querySelectorAll('.nav-item');
    
    // Hide all first, then show based on role permissions
    // This is safer than hiding specific ones.
    
    // But sticking to existing pattern for stability:
    const adminLinks = document.querySelectorAll('a[href="admin.html"], a[href="students.html"], a[href="advisors.html"], a[href="jurados.html"], a[href="schools.html"]');
    const studentLinks = document.querySelectorAll('a[href="student-advisors.html"], a[href="student-requests.html"], a[href="student-kanban.html"], .nav-item.student-only');
    const schoolLinks = document.querySelectorAll('a[href="school-requests.html"]');
    const advisorLinks = document.querySelectorAll('.nav-item.advisor-only'); // Use class selector for new advisor items

    // 1. Admin
    if (currentUser.role === 'admin') {
        adminLinks.forEach(l => l.style.display = 'flex');
        studentLinks.forEach(l => l.style.display = 'none');
        schoolLinks.forEach(l => l.style.display = 'none');
        advisorLinks.forEach(l => l.style.display = 'none');
    }
    // 2. Student
    else if (currentUser.role === 'student') {
        adminLinks.forEach(l => l.style.display = 'none');
        studentLinks.forEach(l => l.style.display = 'flex');
        schoolLinks.forEach(l => l.style.display = 'none');
        advisorLinks.forEach(l => l.style.display = 'none'); 
        
        // Check for advisor requirements is now handled on the page level or via click intercept if desired, 
        // but user requested it to appear in menu.
    }
    // 3. School
    else if (currentUser.role === 'school') {
        adminLinks.forEach(l => l.style.display = 'none');
        studentLinks.forEach(l => l.style.display = 'none');
        schoolLinks.forEach(l => l.style.display = 'flex');
        advisorLinks.forEach(l => l.style.display = 'none');
    }
    // 4. Advisor
    else if (currentUser.role === 'advisor') {
        adminLinks.forEach(l => l.style.display = 'none');
        studentLinks.forEach(l => l.style.display = 'none');
        schoolLinks.forEach(l => l.style.display = 'none');
        advisorLinks.forEach(l => l.style.display = 'flex');
    }
    // 5. Jury (if implemented)
    else {
        // Hide almost everything or specific logic for Jury
        adminLinks.forEach(l => l.style.display = 'none');
        studentLinks.forEach(l => l.style.display = 'none');
        schoolLinks.forEach(l => l.style.display = 'none');
        advisorLinks.forEach(l => l.style.display = 'none');
    }
}

function setupDashboard() {
    // Logout Handler
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            localStorage.removeItem('nexus_auth');
            // localStorage.removeItem('nexus_current_user'); // Optional: Clear user data on logout
            window.location.href = 'login.html';
        });
    }

    // WhatsApp FAB
    const fab = document.querySelector('.fab-whatsapp');
    if (fab) {
        fab.href = "https://wa.me/51953967519"; 
        fab.target = "_blank";
    }
}

