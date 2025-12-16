// Kanban Logic

let draggedCard = null;
let editingTaskId = null; // Track if we are editing
let tempTaskData = { comments: [], attachments: [] }; // Temporary storage for new tasks

document.addEventListener('DOMContentLoaded', () => {
    // Only init if board exists
    if(document.querySelector('.kanban-board')) {
        initKanban();
    }
});

function initKanban() {
    renderBoard();
    setupDragAndDrop();
    setupModal();
}

// Data Handling
function getTasks() {
    return JSON.parse(localStorage.getItem('nexus_kanban_tasks')) || [];
}

function saveTasks(tasks) {
    localStorage.setItem('nexus_kanban_tasks', JSON.stringify(tasks));
}

// Render
function renderBoard() {
    const tasks = getTasks();
    const currentUser = JSON.parse(localStorage.getItem('nexus_current_user'));
    
    // Clear columns (keep headers)
    document.querySelectorAll('.kanban-tasks').forEach(col => col.innerHTML = '');

    let myTasks = [];
    if(currentUser.role === 'student') {
        // Student sees tasks assigned to them (by ID or Code)
        myTasks = tasks.filter(t => t.studentId === currentUser.code || t.studentId === currentUser.user);
    } else if (currentUser.role === 'advisor') {
        const myAdvisorIds = [currentUser.user, currentUser.id, currentUser.code].filter(Boolean);
        const allRequests = JSON.parse(localStorage.getItem('nexus_requests')) || [];
        
        // Find students assigned to this advisor (Robust Match)
        const myStudentIds = allRequests
            .filter(r => r.type === 'Designación de Asesor' && r.status === 'approved' && r.designation && myAdvisorIds.includes(r.designation.advisorId))
            .map(r => r.studentId);

        // Also include 'superuser' explicitly for 'superac' for robustness
        if (myAdvisorIds.includes('superac')) { // Check if 'superac' is among the advisor's IDs
            myStudentIds.push('superuser');
            myStudentIds.push('SUPER-001');
        }
        
        myTasks = tasks.filter(t => myStudentIds.includes(t.studentId) || myStudentIds.includes(t.creator));

        // Update UI Info
        const infoEl = document.getElementById('advisor-watching-info');
        if(infoEl) {
             const names = allRequests
                .filter(r => r.type === 'Designación de Asesor' && r.status === 'approved' && r.designation && myAdvisorIds.includes(r.designation.advisorId))
                .map(r => r.studentName);
             
             if(myAdvisorIds.includes('superac') && !names.includes('Super Usuario')) names.push('Super Usuario');
             
             infoEl.textContent = names.length > 0 
                ? `Creando tareas para: ${[...new Set(names)].join(', ')}` 
                : 'No tienes estudiantes asignados con tesis aprobada.';
        }
    } else {
        // Admin or others see all
        myTasks = tasks;
    }

    myTasks.forEach(task => {
        const card = createCardElement(task);
        const column = document.getElementById(`tasks-${task.status}`);
        if(column) {
            column.appendChild(card);
        } else {
            console.error(`Missing container: tasks-${task.status}`);
        }
    });

    // Hide Add Buttons for Students
    // Add Buttons visible for all
}

function createCardElement(task) {
    const currentUser = JSON.parse(localStorage.getItem('nexus_current_user'));
    const el = document.createElement('div');
    el.className = `kanban-card priority-${task.priority}`;
    el.draggable = true;
    el.dataset.id = task.id;
    
    // Show attachment/comment indicators
    const hasFiles = task.attachments && task.attachments.length > 0;
    const hasComments = task.comments && task.comments.length > 0;
    
    // Determine Last Contributor
    const allActivity = [...(task.comments||[]), ...(task.attachments||[])];
    allActivity.sort((a,b) => new Date(b.date) - new Date(a.date));
    const lastContrib = allActivity.length > 0 ? allActivity[0] : null;

    const deleteDisplay = 'block';

    el.innerHTML = `
        <div class="card-header-flex" style="display:flex; justify-content:space-between; align-items:start;">
            <div class="card-title" style="margin-bottom:5px;">${task.title}</div>
            <div class="card-actions" style="display:flex; gap:5px;">
                <button class="btn-icon-xs edit-btn" style="cursor:pointer; background:none; border:none; color:#1976d2;"><i class="ri-pencil-line"></i></button>
                <button class="btn-icon-xs delete-btn" style="cursor:pointer; background:none; border:none; color:#d32f2f; display: ${deleteDisplay};"><i class="ri-delete-bin-line"></i></button>
            </div>
        </div>
        
        <div class="card-meta" style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap; font-size: 0.8rem; color: #666;">
            <span><i class="ri-user-line"></i> ${task.assignee || 'Sin asignar'}</span>
            
            <div style="display: flex; gap: 8px;">
                ${hasFiles ? `<span title="Archivos adjuntos" style="background: #e3f2fd; color: #1976d2; padding: 2px 5px; border-radius: 4px; display: flex; align-items: center; gap: 3px;"><i class="ri-attachment-line"></i> ${task.attachments.length}</span>` : ''}
                ${hasComments ? `<span title="Comentarios" style="background: #e8f5e9; color: #2e7d32; padding: 2px 5px; border-radius: 4px; display: flex; align-items: center; gap: 3px;"><i class="ri-chat-3-line"></i> ${task.comments.length}</span>` : ''}
            </div>

            <span style="margin-left: auto;"><i class="ri-time-line"></i> ${formatDate(task.date)}</span>
        </div>
        
        ${(() => {
            if(!lastContrib) return '';
            const typeLabel = lastContrib.text ? 'Comentario' : 'PDF';
            const roleLabel = lastContrib.role ? `(${lastContrib.role})` : '';
            return `<div style="font-size: 0.75rem; color: #555; margin-top: 6px; font-style: italic; border-top: 1px solid #eee; padding-top: 4px;">Últ. aporte: <strong>${typeLabel}</strong> por <strong>${lastContrib.author || 'Usuario'} ${roleLabel}</strong></div>`;
        })()}
    `;
    
    // Attach Listeners
    el.querySelector('.edit-btn').addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent drag or other clicks
        openEditModal(task);
    });

    el.querySelector('.delete-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        if(confirm('¿Estás seguro de eliminar esta tarea?')) {
            deleteTask(task.id);
        }
    });

    return el;
}

function formatDate(isoString) {
    const d = new Date(isoString);
    return `${d.getDate()}/${d.getMonth()+1}`;
}

function deleteTask(taskId) {
    let tasks = getTasks();
    tasks = tasks.filter(t => t.id !== taskId);
    saveTasks(tasks);
    renderBoard();
}

function openEditModal(task) {
    editingTaskId = task.id;
    const modal = document.getElementById('task-modal');
    const titleInput = document.getElementById('task-title');
    const priorityInput = document.getElementById('task-priority');
    const modalTitle = modal.querySelector('h3');
    
    const currentUser = JSON.parse(localStorage.getItem('nexus_current_user'));

    if(modalTitle) modalTitle.textContent = 'Editar Tarea';
    titleInput.value = task.title;
    priorityInput.value = task.priority;
    
    // Inputs enabled for everyone
    titleInput.disabled = false;
    priorityInput.disabled = false;
    
    // Advisor specific field
    const assignSelect = document.getElementById('task-student-assign');
    if(assignSelect && task.studentId) {
        assignSelect.value = task.studentId;
    }

    // Enable Right Pane & Render Content
    const rightPane = modal.querySelector('.modal-right');
    if(rightPane) {
        rightPane.style.opacity = '1';
        rightPane.style.pointerEvents = 'auto';
        renderComments(task);
        renderFiles(task);
    }

    modal.classList.remove('hidden');
    modal.classList.add('show');
}

function renderComments(task) {
    const list = document.getElementById('task-comments');
    if(!list) return;
    
    const comments = task.comments || [];
    if(comments.length === 0) {
        list.innerHTML = '<div style="text-align: center; color: #999; margin-top: 20px;">No hay comentarios aún.</div>';
    } else {
        list.innerHTML = comments.map(c => `
            <div class="comment-item">
                <div class="comment-header">
                    <span class="comment-author">${c.author}</span>
                    <span class="comment-date">${formatDate(c.date)}</span>
                </div>
                <div class="comment-body">${c.text}</div>
            </div>
        `).join('');
        list.scrollTop = list.scrollHeight;
    }
}

function renderFiles(task) {
    const list = document.getElementById('task-files');
    if(!list) return;

    const files = task.attachments || [];
    list.innerHTML = files.map(f => `
        <div class="attachment-item">
            <div class="file-info">
                <i class="ri-file-pdf-line file-icon"></i>
                <div>
                    <div class="file-name">${f.name}</div>
                    <div class="file-size">${f.size || '2.4 MB'}</div>
                </div>
            </div>
            <a href="#" style="color: #2196f3; font-size: 0.9rem;">Descargar</a>
        </div>
    `).join('');
}

// Drag and Drop
function setupDragAndDrop() {
    const columns = document.querySelectorAll('.kanban-tasks');
    
    document.addEventListener('dragstart', (e) => {
        if (e.target.classList.contains('kanban-card')) {
            draggedCard = e.target;
            e.target.classList.add('dragging');
        }
    });

    document.addEventListener('dragend', (e) => {
        if (e.target.classList.contains('kanban-card')) {
            e.target.classList.remove('dragging');
            draggedCard = null;
            document.querySelectorAll('.kanban-column').forEach(c => c.classList.remove('drag-over'));
        }
    });

    columns.forEach(col => {
        col.addEventListener('dragover', (e) => {
            e.preventDefault();
            const afterElement = getDragAfterElement(col, e.clientY);
            const draggable = document.querySelector('.dragging');
            if (afterElement == null) {
                col.appendChild(draggable);
            } else {
                col.insertBefore(draggable, afterElement);
            }
            col.closest('.kanban-column').classList.add('drag-over');
        });
        
        col.addEventListener('dragleave', () => {
             col.closest('.kanban-column').classList.remove('drag-over');
        });

        col.addEventListener('drop', (e) => {
            e.preventDefault();
            const columnId = col.id.replace('tasks-', '');
            if(draggedCard) {
                const cardId = draggedCard.dataset.id;
                updateTaskStatus(cardId, columnId);
            }
            col.closest('.kanban-column').classList.remove('drag-over');
        });
    });
}

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.kanban-card:not(.dragging)')];

    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function updateTaskStatus(taskId, newStatus) {
    const tasks = getTasks();
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if(taskIndex !== -1) {
        tasks[taskIndex].status = newStatus;
        saveTasks(tasks);
    }
}

// Modal & Add Task
function setupModal() {
    const modal = document.getElementById('task-modal');
    const closeBtn = document.getElementById('close-task-modal');
    const saveBtn = document.getElementById('save-task-btn');
    const btns = document.querySelectorAll('.add-task-btn');
    const postCommentBtn = document.getElementById('btn-post-comment');
    const fileInput = document.getElementById('task-file-input');
    const currentUser = JSON.parse(localStorage.getItem('nexus_current_user'));

    // Inject/Populate Student Select for Advisors
    const assignSelectId = 'task-student-assign';
    let assignSelect = document.getElementById(assignSelectId);

    if (currentUser.role === 'advisor') {
        // Inject if missing
        if (!assignSelect) {
             const formGroup = document.createElement('div');
             formGroup.className = 'form-group';
             formGroup.id = 'assign-student-group';
             formGroup.innerHTML = `<label>Asignar a Estudiante</label><select id="${assignSelectId}" class="form-control"></select>`;
             
             const priorityGroup = document.querySelector('#task-priority').closest('.form-group');
             if(priorityGroup) {
                 priorityGroup.parentNode.insertBefore(formGroup, priorityGroup.nextSibling);
                 assignSelect = document.getElementById(assignSelectId);
             }
        }
        
        // Populate if empty
        if (assignSelect && assignSelect.options.length === 0) {
            // Match against user, id, or code to be robust
            const myAdvisorIds = [currentUser.user, currentUser.id, currentUser.code].filter(Boolean);
            const allRequests = JSON.parse(localStorage.getItem('nexus_requests')) || [];

            // Find students assigned to this advisor (Robust Match)
            const myStudents = allRequests
                .filter(r => r.type === 'Designación de Asesor' && r.status === 'approved' && r.designation && myAdvisorIds.includes(r.designation.advisorId));
             
             const addedIds = new Set();
             
             myStudents.forEach(r => {
                 if(!addedIds.has(r.studentId)) {
                     const opt = document.createElement('option');
                     opt.value = r.studentId;
                     opt.textContent = r.studentName;
                     assignSelect.appendChild(opt);
                     addedIds.add(r.studentId);
                 }
             });

             // Fallback for Superac/Superuser testing
             if(myAdvisorIds.includes('superac') && !addedIds.has('superuser')) {
                 const opt = document.createElement('option');
                 opt.value = 'superuser';
                 opt.textContent = 'Super Usuario (Estudiante)';
                 assignSelect.appendChild(opt);
                 addedIds.add('superuser');
             }
             
             if(assignSelect.options.length === 0) {
                  const opt = document.createElement('option');
                  opt.value = '';
                  opt.textContent = 'No hay estudiantes asignados';
                  assignSelect.appendChild(opt);
                  assignSelect.disabled = true;
             }
        }
    }
    
    let targetColumn = 'todo';

    btns.forEach(btn => {
        btn.addEventListener('click', () => {
            editingTaskId = null; // New Task Mode
            targetColumn = btn.dataset.col;
            
            // Reset Temp Data
            tempTaskData = { comments: [], attachments: [] };

            if(modal) {
                // Reset Fields
                document.getElementById('task-title').value = '';
                document.getElementById('task-priority').value = 'medium';
                if(modal.querySelector('h3')) modal.querySelector('h3').textContent = 'Nueva Tarea';

                // Enable Right Pane (always optional)
                const rightPane = modal.querySelector('.modal-right');
                if(rightPane) {
                    rightPane.style.opacity = '1';
                    rightPane.style.pointerEvents = 'auto';
                }
                
                // Render Empty/Temp
                renderComments(tempTaskData);
                renderFiles(tempTaskData);

                modal.classList.remove('hidden');
                modal.classList.add('show');
            }
        });
    });

    if(closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.classList.remove('show');
            setTimeout(() => modal.classList.add('hidden'), 300);
        });
    }

    // Comment Logic
    if(postCommentBtn) {
        const newBtn = postCommentBtn.cloneNode(true);
        postCommentBtn.parentNode.replaceChild(newBtn, postCommentBtn);
        
        newBtn.addEventListener('click', () => {
            const input = document.getElementById('task-comment-input');
            const text = input.value.trim();
            if(!text) return;
            
            const roleDisplay = currentUser.role === 'advisor' ? 'Asesor' : 'Estudiante';
            const newComment = {
                id: Date.now(),
                text: text,
                author: currentUser.name,
                role: roleDisplay,
                date: new Date().toISOString()
            };

            if(editingTaskId) {
                const tasks = getTasks();
                const task = tasks.find(t => t.id === editingTaskId);
                if(task) {
                    if(!task.comments) task.comments = [];
                    task.comments.push(newComment);
                    saveTasks(tasks);
                    renderComments(task);
                    renderBoard();
                }
            } else {
                // Temp
                tempTaskData.comments.push(newComment);
                renderComments(tempTaskData);
            }
            input.value = '';
        });
    }

    // File Upload Logic
    if(fileInput) {
        const newInp = fileInput.cloneNode(true);
        fileInput.parentNode.replaceChild(newInp, fileInput);

        newInp.addEventListener('change', (e) => {
            if(!e.target.files[0]) return;
            const file = e.target.files[0];
            
            const roleDisplay = currentUser.role === 'advisor' ? 'Asesor' : 'Estudiante';
            const newFile = {
                name: file.name,
                size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
                date: new Date().toISOString(),
                type: 'pdf',
                author: currentUser.name,
                role: roleDisplay
            };

            if(editingTaskId) {
                const tasks = getTasks();
                const task = tasks.find(t => t.id === editingTaskId);
                if(task) {
                    if(!task.attachments) task.attachments = [];
                    task.attachments.push(newFile);
                    saveTasks(tasks);
                    renderFiles(task);
                    renderBoard();
                }
            } else {
                // Temp
                tempTaskData.attachments.push(newFile);
                renderFiles(tempTaskData);
            }
            e.target.value = ''; // Reset
        });
    }

    if(saveBtn) {
        const newSaveBtn = saveBtn.cloneNode(true);
        saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);
        
        newSaveBtn.addEventListener('click', () => {
            const titleInput = document.getElementById('task-title');
            const title = titleInput.value.trim();
            const priorityInput = document.getElementById('task-priority');
            const priority = priorityInput.value;
            
            if(!title) {
                alert('Por favor, ingresa un título para la tarea.');
                return;
            }

            // Unified Target Logic
            let studentTarget = currentUser.user || currentUser.code; 
            const select = document.getElementById('task-student-assign');
            if (select && select.value) {
                studentTarget = select.value;
            }
            
            const tasks = getTasks();

            if (editingTaskId) {
                // UPDATE EXISTING
                const taskIndex = tasks.findIndex(t => t.id === editingTaskId);
                if(taskIndex !== -1) {
                    tasks[taskIndex].title = title;
                    tasks[taskIndex].priority = priority;
                    if(currentUser.role === 'advisor') {
                        tasks[taskIndex].studentId = studentTarget; 
                    }
                }
            } else {
                // CREATE NEW
                const newTask = {
                    id: 'TASK-' + Date.now(),
                    title: title,
                    priority: priority,
                    status: targetColumn || 'todo', 
                    date: new Date().toISOString(),
                    studentId: studentTarget,
                    creator: currentUser.user,
                    assignee: currentUser.role === 'advisor' ? 'Estudiante' : currentUser.name.split(' ')[0],
                    comments: tempTaskData.comments, // Use temp
                    attachments: tempTaskData.attachments // Use temp
                };
                tasks.push(newTask);
            }

            saveTasks(tasks);
            renderBoard();
            
            // Close
            modal.classList.remove('show');
            titleInput.value = '';
            editingTaskId = null;
        });
    }
}

