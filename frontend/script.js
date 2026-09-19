// All queue data is kept in one localStorage object for this project demo.
const STORAGE_KEY = 'queueCareState';

const defaultState = { patients: [], currentToken: 0, nextToken: 1 };
let state = loadState();

function loadState() {
  try {
    const savedState = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return savedState ? { ...defaultState, ...savedState } : { ...defaultState };
  } catch (error) {
    return { ...defaultState };
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

function showView(viewId) {
  document.querySelectorAll('.view').forEach((view) => view.classList.toggle('active-view', view.id === viewId));
  document.querySelectorAll('[data-view]').forEach((button) => button.classList.toggle('active', button.dataset.view === viewId));
  window.scrollTo({ top: 0, behavior: 'smooth' });
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

function handleRegistration(event) {
  event.preventDefault();
  const form = event.target;
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }
  const formData = new FormData(form);
  const patient = {
    token: state.nextToken,
    name: formData.get('patientName').trim(),
    age: formData.get('patientAge'),
    gender: formData.get('patientGender'),
    phone: formData.get('patientPhone'),
    problem: formData.get('healthProblem').trim(),
    department: formData.get('department'),
    registeredAt: new Date().toISOString()
  };
  state.patients.push(patient);
  state.nextToken += 1;
  saveState();
  updateOverview();
  document.getElementById('registrationResult').innerHTML = `<span class="success-message">Registration successful!</span><span class="token-number">${formatToken(patient.token)}</span><p>Please keep this token number. You have <strong>${state.patients.filter((item) => item.token < patient.token && item.token > state.currentToken).length}</strong> ${patient.token - state.currentToken === 1 ? 'person' : 'people'} ahead of you.</p>`;
  document.getElementById('registrationResult').classList.remove('hidden');
  form.reset();
}

function handleStatusLookup(event) {
  event.preventDefault();
  const token = Number(document.getElementById('statusToken').value);
  const result = document.getElementById('statusResult');
  const patient = state.patients.find((item) => item.token === token);
  if (!patient) {
    result.innerHTML = '<div class="empty-state"><span>?</span><strong>Token not found</strong><p>Please check the number and try again.</p></div>';
    return;
  }
  const waitingBefore = state.patients.filter((item) => item.token > state.currentToken && item.token < token).length;
  const isServed = token <= state.currentToken;
  const statusText = isServed ? 'Already served' : 'Waiting in queue';
  const waitText = isServed ? 'Your visit has been completed.' : waitingBefore === 0 ? 'You are next in line.' : `Approximately ${waitingBefore * 10} minutes`;
  result.innerHTML = `<div class="status-head"><h3>${formatToken(patient.token)}</h3><span class="status-pill">${statusText}</span></div><div class="status-grid"><div class="status-box"><span>Now serving</span><strong>${formatToken(state.currentToken)}</strong></div><div class="status-box"><span>People before you</span><strong>${isServed ? 0 : waitingBefore}</strong></div><div class="status-box"><span>Department</span><strong>${escapeHtml(patient.department)}</strong></div><div class="status-box"><span>Approx. waiting</span><strong>${isServed ? 'Done' : waitingBefore === 0 ? 'Next' : `${waitingBefore * 10} min`}</strong></div></div><p class="status-summary">${waitText} Thank you, ${escapeHtml(patient.name)}.</p>`;
}

function callNextPatient() {
  const nextPatient = state.patients.find((patient) => patient.token > state.currentToken);
  const message = document.getElementById('adminMessage');
  if (!nextPatient) {
    message.textContent = 'There are no waiting patients.';
    message.classList.add('error');
    return;
  }
  state.currentToken = nextPatient.token;
  saveState();
  updateOverview();
  message.textContent = `${formatToken(nextPatient.token)} is now being served.`;
  message.classList.remove('error');
}

function resetQueue() {
  if (!state.patients.length || window.confirm('Reset today\'s queue and remove all patient records?')) {
    state = { ...defaultState };
    saveState();
    updateOverview();
    document.getElementById('adminMessage').textContent = 'Queue reset successfully.';
    document.getElementById('adminMessage').classList.remove('error');
  }
}

document.querySelectorAll('[data-view]').forEach((button) => button.addEventListener('click', () => showView(button.dataset.view)));
document.getElementById('registrationForm').addEventListener('submit', handleRegistration);
document.getElementById('statusForm').addEventListener('submit', handleStatusLookup);
document.getElementById('nextPatientButton').addEventListener('click', callNextPatient);
document.getElementById('resetQueueButton').addEventListener('click', resetQueue);
document.getElementById('todayDate').textContent = new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date());
updateOverview();