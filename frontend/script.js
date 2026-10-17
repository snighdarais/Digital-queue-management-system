// All queue data is kept in one localStorage object for this project demo.
const STORAGE_KEY = 'queueCareState';
// Support requests remain separate so resetting today's queue does not erase them.
const SUPPORT_STORAGE_KEY = 'queueCareSupportRequests';

const defaultState = { patients: [], currentToken: 0, nextToken: 1, maxTokens: 50 };
const facilityCategories = ['General Hospitals', 'Dental Clinics', 'Eye Clinics', 'Pediatric/Children\'s Clinics', 'Emergency Hospitals', 'Other Clinics'];
// Keep this data shape compatible with future results from a verified places API.
const demoFacilities = [
  { name: 'Sample General Hospital', category: 'General Hospitals', location: 'Demo location (not a real address)', contact: '' },
  { name: 'Sample Dental Clinic', category: 'Dental Clinics', location: 'Demo location (not a real address)', contact: '' },
  { name: 'Sample Eye Clinic', category: 'Eye Clinics', location: 'Demo location (not a real address)', contact: '' },
  { name: 'Sample Children\'s Clinic', category: 'Pediatric/Children\'s Clinics', location: 'Demo location (not a real address)', contact: '' },
  { name: 'Sample Emergency Hospital', category: 'Emergency Hospitals', location: 'Demo location (not a real address)', contact: '' },
  { name: 'Sample Community Clinic', category: 'Other Clinics', location: 'Demo location (not a real address)', contact: '' }
];
let state = loadState();

function createDefaultState() {
  return { ...defaultState, patients: [] };
}

function loadState() {
  try {
    const savedState = JSON.parse(localStorage.getItem(STORAGE_KEY));
    const loadedState = savedState ? { ...createDefaultState(), ...savedState } : createDefaultState();
    const savedLimit = Number(loadedState.maxTokens);
    loadedState.maxTokens = Number.isInteger(savedLimit) && savedLimit > 0 ? savedLimit : defaultState.maxTokens;
    return loadedState;
  } catch (error) {
    return createDefaultState();
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function formatToken(token) {
  return token ? `T-${String(token).padStart(3, '0')}` : '--';
}

function getWaitingPatients() {
  return state.patients.filter((patient) => patient.token > state.currentToken);
}

function getAverageWait() {
  return getWaitingPatients().length * 10;
}

function getRemainingTokens() {
  return Math.max(0, state.maxTokens - state.patients.length);
}

function showView(viewId, targetId) {
  document.querySelectorAll('.view').forEach((view) => view.classList.toggle('active-view', view.id === viewId));
  document.querySelectorAll('[data-view]').forEach((button) => button.classList.toggle('active', button.dataset.view === viewId));
  if (targetId) {
    requestAnimationFrame(() => document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  } else {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

function updateOverview() {
  const waiting = getWaitingPatients().length;
  const current = formatToken(state.currentToken);
  document.getElementById('homeCurrentToken').textContent = current;
  document.getElementById('homeWaitingCount').textContent = waiting;
  document.getElementById('homeRegisteredCount').textContent = state.patients.length;
  document.getElementById('homeAvgWait').textContent = `${getAverageWait()} min`;
  document.getElementById('adminTotal').textContent = state.patients.length;
  document.getElementById('adminCurrent').textContent = current;
  document.getElementById('adminWaiting').textContent = waiting;
  document.getElementById('adminWait').textContent = `${getAverageWait()} min`;
  document.getElementById('queueStatusBadge').textContent = waiting ? `${waiting} waiting` : 'Queue empty';
  document.getElementById('currentPatientCount').textContent = state.patients.length;
  document.getElementById('maxTokenCount').textContent = state.maxTokens;
  document.getElementById('remainingTokenCount').textContent = getRemainingTokens();
  document.getElementById('adminRegisteredCount').textContent = state.patients.length;
  document.getElementById('adminMaxTokenCount').textContent = state.maxTokens;
  document.getElementById('adminRemainingTokenCount').textContent = getRemainingTokens();
  document.getElementById('maxTokenInput').value = state.maxTokens;
  document.getElementById('registrationLimitMessage').classList.toggle('hidden', getRemainingTokens() > 0);
  document.querySelector('#registrationForm button[type="submit"]').disabled = getRemainingTokens() === 0;
  renderPatientTable();
}

function renderPatientTable() {
  const tableBody = document.getElementById('patientTableBody');
  if (!state.patients.length) {
    tableBody.innerHTML = '<tr><td colspan="5" class="table-empty">No patients registered yet.</td></tr>';
    return;
  }
  tableBody.innerHTML = state.patients.map((patient) => {
    const status = patient.token <= state.currentToken ? 'Served' : 'Waiting';
    return `<tr><td>${formatToken(patient.token)}</td><td>${escapeHtml(patient.name)}<br><span class="patient-status">Age ${patient.age} · ${patient.gender}</span></td><td>${escapeHtml(patient.department)}</td><td>${escapeHtml(patient.problem)}</td><td><span class="patient-status ${status.toLowerCase()}">${status}</span></td></tr>`;
  }).join('');
}

// Keep patient-entered text safe when it is placed into the admin table.
function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[character]));
}

async function handleRegistration(event) {
    event.preventDefault();

    const form = event.target;

    const nameInput = document.getElementById('patientName');
    const ageInput = document.getElementById('patientAge');
    const phoneInput = document.getElementById('patientPhone');

    const name = nameInput.value.trim();
    const ageText = ageInput.value.trim();
    const phone = phoneInput.value.trim();

    nameInput.setCustomValidity('');
    ageInput.setCustomValidity('');
    phoneInput.setCustomValidity('');

    // Validation
    if (!/^[\p{L} ]+$/u.test(name)) {
        nameInput.setCustomValidity(
            'Enter a patient name using letters and spaces only.'
        );
    }

    if (
        !/^[0-9]+$/.test(ageText) ||
        Number(ageText) < 1 ||
        Number(ageText) > 120
    ) {
        ageInput.setCustomValidity(
            'Enter a valid age from 1 to 120 using numbers only.'
        );
    }

    if (!/^[0-9]{10}$/.test(phone)) {
        phoneInput.setCustomValidity(
            'Enter a phone number containing exactly 10 digits.'
        );
    }

    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    if (getRemainingTokens() === 0) {
        document
            .getElementById('registrationLimitMessage')
            .classList.remove('hidden');
        return;
    }

    const formData = new FormData(form);

    const token = state.nextToken;

    const patientData = {
        patientName: name,
        patientAge: Number(ageText),
        patientGender: formData.get('patientGender'),
        patientPhone: phone,
        healthProblem: formData.get('healthProblem').trim(),
        department: formData.get('department')
    };

    try {
        // 1. Save patient to backend/database
        const patientResponse = await fetch(
            'http://localhost:5000/api/patients',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(patientData)
            }
        );

        const patientResult = await patientResponse.json();

        if (!patientResponse.ok || !patientResult.success) {
            throw new Error(
                patientResult.message || 'Patient registration failed.'
            );
        }

        // 2. Create token in backend/database
        const tokenResponse = await fetch(
            'http://localhost:5000/api/tokens',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    patientId: patientResult.patientId,
                    patientName: name,
                    department: patientData.department,
                    tokenNumber: String(token)
                })
            }
        );

        const tokenResult = await tokenResponse.json();

        if (!tokenResponse.ok || !tokenResult.success) {
            throw new Error(
                tokenResult.message || 'Token generation failed.'
            );
        }

        // 3. Keep frontend UI state
        const patient = {
            id: patientResult.patientId,
            tokenId: tokenResult.token.id,
            token: token,
            name,
            age: Number(ageText),
            gender: patientData.patientGender,
            phone,
            problem: patientData.healthProblem,
            department: patientData.department,
            registeredAt: new Date().toISOString()
        };

        state.patients.push(patient);
        state.nextToken += 1;

        saveState();
        updateOverview();

        // 4. Show success message
        document.getElementById('registrationResult').innerHTML = `
            <span class="success-message">
                Registration successful!
            </span>

            <span class="token-number">
                ${formatToken(patient.token)}
            </span>

            <p>
                Please keep this token number. You have
                <strong>
                    ${
                        state.patients.filter(
                            (item) =>
                                item.token < patient.token &&
                                item.token > state.currentToken
                        ).length
                    }
                </strong>
                ${
                    patient.token - state.currentToken === 1
                        ? 'person'
                        : 'people'
                }
                ahead of you.
            </p>
        `;

        document
            .getElementById('registrationResult')
            .classList.remove('hidden');

        // 5. Reset form
        form.reset();

        nameInput.setCustomValidity('');
        ageInput.setCustomValidity('');
        phoneInput.setCustomValidity('');

    } catch (error) {
        console.error('Registration error:', error);

        const result = document.getElementById('registrationResult');

        result.innerHTML = `
            <span class="error-message">
                Registration failed.
            </span>
            <p>${escapeHtml(error.message)}</p>
            <p>Please make sure the backend server is running.</p>
        `;

        result.classList.remove('hidden');
    }
}

function loadSupportRequests() {
  try {
    const requests = JSON.parse(localStorage.getItem(SUPPORT_STORAGE_KEY));
    return Array.isArray(requests) ? requests : [];
  } catch (error) {
    return [];
  }
}

function handleSupportSubmission(event) {
  event.preventDefault();
  const form = event.target;
  const phoneInput = document.getElementById('supportPhone');
  phoneInput.setCustomValidity('');
  if (!/^[0-9]{10}$/.test(phoneInput.value.trim())) {
    phoneInput.setCustomValidity('Enter a phone number containing exactly 10 digits.');
  }
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const formData = new FormData(form);
  const selectedIssue = formData.get('supportIssue');
  const request = {
    name: formData.get('supportName').trim(),
    phone: phoneInput.value.trim(),
    issue: selectedIssue === 'Other' ? `Other: ${formData.get('supportOther').trim()}` : selectedIssue,
    message: formData.get('supportMessage').trim(),
    submittedAt: new Date().toISOString()
  };
  const requests = loadSupportRequests();
  requests.push(request);
  try {
    localStorage.setItem(SUPPORT_STORAGE_KEY, JSON.stringify(requests));
    document.getElementById('supportResult').textContent = 'Your support request has been saved. Thank you for contacting us.';
    document.getElementById('supportResult').classList.remove('hidden');
    form.reset();
    updateSupportOtherField();
  } catch (error) {
    document.getElementById('supportResult').textContent = 'This request could not be saved in this browser. Please try again later.';
    document.getElementById('supportResult').classList.remove('hidden');
  }
}

function updateSupportOtherField() {
  const isOther = document.getElementById('supportIssue').value === 'Other';
<Questions>
</Questions>
</Question>
  const otherWrap = document.getElementById('supportOtherWrap');
  const otherInput = document.getElementById('supportOther');
  otherWrap.classList.toggle('hidden', !isOther);
  otherInput.required = isOther;
}

function renderFacilities(facilities = demoFacilities) {
  const facilityGroups = document.getElementById('facilityGroups');
  facilityGroups.innerHTML = facilityCategories.map((category, index) => {
    const categoryFacilities = facilities.filter((facility) => facility.category === category);
    const cards = categoryFacilities.length ? categoryFacilities.map((facility) => `<article class="facility-card"><span class="facility-demo-label">Sample data</span><h4>${escapeHtml(facility.name)}</h4><p><strong>Type</strong>${escapeHtml(facility.category)}</p><p><strong>Location</strong>${escapeHtml(facility.location || 'Not provided')}</p><p><strong>Contact</strong>${escapeHtml(facility.contact || 'Not provided')}</p></article>`).join('') : '<p class="facility-empty">No listings available in this category.</p>';
    const sectionId = index === 4 ? 'facility-category-emergency' : `facility-category-${index}`;
    return `<section class="facility-group" id="${sectionId}"><h3>${escapeHtml(category)}</h3><div class="facility-grid">${cards}</div></section>`;
  }).join('');
}



async function callNextPatient() {
    const nextPatient = state.patients.find(
        (patient) => patient.token > state.currentToken
    );

    const message = document.getElementById('adminMessage');

    if (!nextPatient) {
        message.textContent = 'There are no waiting patients.';
        message.classList.add('error');
        return;
    }

    try {
        const response = await fetch(
            `http://localhost:5000/api/tokens/${nextPatient.id}/status`,
            {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    status: 'served'
                })
            }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(
                data.message || 'Could not update token status.'
            );
        }

        state.currentToken = nextPatient.token;

        saveState();
        updateOverview();

        message.textContent =
            `${formatToken(nextPatient.token)} is now being served.`;

        message.classList.remove('error');

    } catch (error) {
        console.error('Next patient error:', error);

        message.textContent =
            'Unable to update the queue. Please check the backend server.';

        message.classList.add('error');
    }
}

function resetQueue() {
  if (!state.patients.length || window.confirm('Reset today\'s queue and remove all patient records?')) {
    state = createDefaultState();
    saveState();
    updateOverview();
    document.getElementById('adminMessage').textContent = 'Queue reset successfully.';
    document.getElementById('adminMessage').classList.remove('error');
  }
}

document.querySelectorAll('[data-view]').forEach((button) => button.addEventListener('click', () => showView(button.dataset.view, button.dataset.target)));
document.getElementById('registrationForm').addEventListener('submit', handleRegistration);
document.getElementById('statusForm').addEventListener('submit', handleStatusLookup);
document.getElementById('supportForm').addEventListener('submit', handleSupportSubmission);
document.getElementById('supportIssue').addEventListener('change', updateSupportOtherField);
document.getElementById('limitForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const limitInput = document.getElementById('maxTokenInput');
  const newLimit = Number(limitInput.value);
  const message = document.getElementById('adminMessage');
  if (!Number.isInteger(newLimit) || newLimit < 1 || newLimit > 1000) {
    limitInput.setCustomValidity('Choose a whole-number limit from 1 to 1000.');
    limitInput.reportValidity();
    return;
  }
  limitInput.setCustomValidity('');
  if (newLimit < state.patients.length) {
    message.textContent = 'The limit cannot be lower than the number of patients already registered.';
    message.classList.add('error');
    return;
  }
  state.maxTokens = newLimit;
  saveState();
  updateOverview();
  message.textContent = `Daily token limit set to ${newLimit}.`;
  message.classList.remove('error');
});
document.getElementById('nextPatientButton').addEventListener('click', callNextPatient);
document.getElementById('resetQueueButton').addEventListener('click', resetQueue);
renderFacilities();
updateSupportOtherField();
document.getElementById('todayDate').textContent = new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date());
updateOverview();