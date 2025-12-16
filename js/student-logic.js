/**
 * Student Logic - Extends app.js logic for student specific features
 * Handles "My Courses" and "Advisors List" view.
 */

document.addEventListener('DOMContentLoaded', () => {
    const currentUser = JSON.parse(localStorage.getItem('nexus_current_user'));

    // 1. Advisor List View
    if (document.getElementById('student-advisors-list')) {
        if (!currentUser || currentUser.role !== 'student') {
            // Optional: stricter redirect if needed check
            // if(!currentUser) window.location.href = 'login.html';
        }
        initAdvisorsView();
    }
    
    // 2. Student Requests View
    if (document.getElementById('fut-modal-overlay')) {
        initRequestsView();
    }
});

// ... (initAdvisorsView and helper remain the same) ...
// (I will skip replacing them usually, but here I can just target the top block easily)
// Actually I need to fix initRequestsView scope too.

function initRequestsView() {
    const modal = document.getElementById('fut-modal-overlay');
    const closeBtn = document.getElementById('fut-modal-close');
    const cancelBtn = document.getElementById('btn-fut-cancel');
    const submitBtn = document.getElementById('btn-fut-submit');
    const cards = document.querySelectorAll('.card[data-type]'); 

    let currentCard = null; // Store active card

    // Prerequisite Check
    const currentUser = JSON.parse(localStorage.getItem('nexus_current_user'));
    const allRequests = JSON.parse(localStorage.getItem('nexus_requests')) || [];
    
    // Find if user has an approved "Inicio de Trámite"
    const hasApprovedInit = allRequests.some(req => 
        req.studentCode === currentUser.code && 
        req.type === 'Inicio de Trámite' && 
        req.status === 'approved'
    );

    const isSuperUser = currentUser.user === 'superuser';

    const advisorCard = document.querySelector('.card[data-type="asesor"]');
    if (advisorCard) {
        if (!hasApprovedInit && !isSuperUser) {
            advisorCard.classList.add('card-locked');
            advisorCard.style.opacity = '0.6';
            advisorCard.style.cursor = 'not-allowed';
            advisorCard.style.filter = 'grayscale(100%)';
            if(advisorCard.querySelector('.btn-primary')) {
                advisorCard.querySelector('.btn-primary').disabled = true;
                advisorCard.querySelector('.btn-primary').innerText = 'Bloqueado';
            }
            if(advisorCard.querySelector('.status-indicator span:last-child')) {
                advisorCard.querySelector('.status-indicator span:last-child').innerText = 'Requiere Aprobación Previa';
            }
            if(advisorCard.querySelector('.status-dot')) {
                advisorCard.querySelector('.status-dot').style.background = '#9e9e9e';
            }
        } else {
             advisorCard.classList.remove('card-locked');
        }
    }

    // Close Modal Function
    const closeModal = () => {
        if(modal) {
            modal.classList.remove('show');
            setTimeout(() => modal.classList.add('hidden'), 300);
        }
    };

    if(closeBtn) closeBtn.addEventListener('click', closeModal);
    if(cancelBtn) cancelBtn.addEventListener('click', closeModal);
    
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
    }

    // Dynamic Modal Content
    let currentRequestType = 'inicio';

    if(cards.length > 0) {
        cards.forEach(card => {
            card.addEventListener('click', () => {
                 if(card.classList.contains('card-locked')) return; 

                 currentCard = card; // capture reference
                 currentRequestType = card.getAttribute('data-type');
                 
                 // Reset fields
                 const advisorFields = document.getElementById('advisor-fields');
                 const advisorDocs = document.getElementById('advisor-docs');
                 const standardDocs = document.getElementById('standard-docs');
                 const advisorSelect = document.getElementById('fut-advisor-select');
                 const designateCheck = document.getElementById('check-school-designate');

                 if(advisorFields) advisorFields.classList.add('hidden');
                 if(advisorDocs) advisorDocs.classList.add('hidden');
                 if(standardDocs) standardDocs.classList.remove('hidden');
                 if(advisorSelect) advisorSelect.classList.add('hidden');
                 
                 // Pre-fill data
                 const currentUser = JSON.parse(localStorage.getItem('nexus_current_user'));
                 const textareas = document.querySelectorAll('.fut-container textarea');
                 const inputs = document.querySelectorAll('.fut-container input[type="text"]');

                 if (currentUser) {
                     if(inputs[0]) inputs[0].value = `DIRECTOR DE LA ESCUELA PROFESIONAL DE ${currentUser.career ? currentUser.career.toUpperCase() : 'INGENIERÍA'}`;

                     const names = currentUser.name.split(' ');
                     let patern = '', matern = '', rest = '';
                     if(names.length >= 3) {
                        patern = names[0]; matern = names[1]; rest = names.slice(2).join(' ');
                     } else if (names.length === 2) {
                         patern = names[0]; rest = names[1];
                     } else {
                         rest = names[0];
                     }

                     if(inputs[2]) inputs[2].value = patern;
                     if(inputs[3]) inputs[3].value = matern;
                     if(inputs[4]) inputs[4].value = rest;
                     if(inputs[5]) inputs[5].value = currentUser.code || ''; 

                     const dniRadio = document.querySelector('.fut-container input[type="radio"][value="DNI"]');
                     if(dniRadio) dniRadio.checked = true;
                 }

                 if (currentRequestType === 'inicio') {
                      if(textareas[0]) textareas[0].value = "SOLICITUD DE INICIO DE TRÁMITE DE GRADOS Y TÍTULOS";
                 } else if (currentRequestType === 'asesor') {
                      if(textareas[0]) textareas[0].value = "SOLICITUD DE DESIGNACIÓN / PROPUESTA DE ASESOR DE TESIS";
                      
                      if(advisorFields) advisorFields.classList.remove('hidden');
                      if(advisorDocs) advisorDocs.classList.remove('hidden');
                      if(standardDocs) standardDocs.classList.add('hidden');
                      
                      if(advisorSelect) {
                          advisorSelect.classList.remove('hidden');
                          const allAdvisors = JSON.parse(localStorage.getItem('nexus_advisors')) || [];
                          const activeAdvisors = allAdvisors.filter(adv => adv.status === 'active' || adv.status === undefined); 

                          advisorSelect.innerHTML = '<option value="">-- Seleccionar Asesor Propuesto (Opcional) --</option>';
                          
                          if(activeAdvisors.length === 0) {
                              const option = document.createElement('option');
                              option.textContent = "No hay asesores disponibles";
                              option.disabled = true;
                              advisorSelect.appendChild(option);
                          } else {
                              activeAdvisors.forEach(adv => {
                                  const option = document.createElement('option');
                                  const label = `${adv.name} | ${adv.specialty || 'General'} | ${adv.career || 'Escuela'}`;
                                  option.value = adv.id || adv.user; 
                                  option.textContent = label;
                                  option.setAttribute('data-name', adv.name);
                                  advisorSelect.appendChild(option);
                              });
                          }
                          
                          if(designateCheck) {
                              designateCheck.checked = false; 
                              advisorSelect.disabled = false;
                              designateCheck.onchange = () => {
                                  if(designateCheck.checked) {
                                      advisorSelect.value = "";
                                      advisorSelect.disabled = true;
                                  } else {
                                      advisorSelect.disabled = false;
                                  }
                              };
                          }
                      }
                 }

                 modal.classList.remove('hidden');
                 void modal.offsetWidth;
                 modal.classList.add('show');
            });
        });
    }

    // Submit Logic
    if (submitBtn) {
        submitBtn.addEventListener('click', () => {
            // Basic validation
            const signature = document.getElementById('fut-signature');
            const declaration = document.getElementById('signature-declaration');
            
            if(!signature.files || signature.files.length === 0) {
                alert("Por favor, adjunte su firma.");
                return;
            }

            if(!declaration || !declaration.checked) {
                alert("Debe aceptar la Declaración Jurada sobre su firma para continuar.");
                declaration.focus();
                return;
            }

            // Save Request Logic
            const currentUser = JSON.parse(localStorage.getItem('nexus_current_user'));
            const requests = JSON.parse(localStorage.getItem('nexus_requests')) || [];
            // ... (rest of logic)
                
            let reqType = 'Inicio de Trámite';
            let reqDetails = {};

            if(currentRequestType === 'asesor') {
                reqType = 'Designación de Asesor';
                    const checkbox = document.getElementById('check-school-designate');
                    const advisorSelect = document.getElementById('fut-advisor-select');
                    
                    const designa = checkbox ? checkbox.checked : false;
                    const proposedAdvisor = advisorSelect ? advisorSelect.value : null;
                    const proposedAdvisorName = advisorSelect && advisorSelect.options[advisorSelect.selectedIndex] ? advisorSelect.options[advisorSelect.selectedIndex].getAttribute('data-name') : null;

                    reqDetails.schoolDesignates = designa;
                    if(!designa && proposedAdvisor) {
                        reqDetails.proposedAdvisorId = proposedAdvisor;
                        reqDetails.proposedAdvisorName = proposedAdvisorName;
                    }
                }

                const newRequest = {
                    id: 'REQ-' + Date.now(),
                    studentName: currentUser ? currentUser.name : 'Estudiante',
                    studentCode: currentUser ? currentUser.code : '',
                    school: currentUser ? currentUser.career : 'General',
                    type: reqType,
                    details: reqDetails,
                    status: 'pending',
                    date: new Date().toISOString(),
                };

                requests.push(newRequest);
                localStorage.setItem('nexus_requests', JSON.stringify(requests));

                // UI Updates
                closeModal();
                if (typeof showToast === 'function') {
                    showToast('Solicitud enviada exitosamente');
                } else {
                     // Fallback
                     if(toast && toastMsg) {
                        toastMsg.textContent = 'Solicitud enviada correctamente';
                        toast.classList.remove('hidden');
                        toast.classList.add('show');
                        setTimeout(() => toast.classList.remove('show'), 3000);
                     }
                }
                
                // Update UI to show pending
                if(currentCard) {
                    const statusDot = currentCard.querySelector('.status-dot');
                    const statusText = currentCard.querySelector('.status-indicator span:last-child');
                    if(statusDot && statusText) {
                        statusDot.classList.remove('status-pendiente');
                        statusDot.style.background = '#ffd700';
                        statusText.textContent = 'En Trámite';
                    }
                }
        });
    }
}

