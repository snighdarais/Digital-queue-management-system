const API_BASE_URL = '';
const defaultState = { patients: [], currentToken: 0, maxTokens: 50 };
const LEGACY_QUEUE_KEY = 'legacy';
const facilityCategories = ['General Hospitals', 'Dental Clinics', 'Eye Clinics', 'Pediatric/Children\'s Clinics', 'Orthopedics', 'Emergency Hospitals', 'Other Clinics'];
const facilities = [
  { name: 'Taluk Government Hospital, Sullia', category: 'General Hospitals', location: 'Srirampete, NH 275, Sullia 574239', contact: '08257 230479', hours: 'Not verified; call the hospital to confirm OPD and emergency hours.', sources: [{ label: 'Karnataka hospital list', url: 'https://amkresourceinfo.com/wp-content/uploads/2023/03/KASS-Hospital-List.pdf' }] },
  { name: 'K.V.G. Medical College & Hospital', category: 'General Hospitals', location: 'Kurunjibag, Sullia 574327', contact: '08257 230316', hours: 'OPD reported Mon–Sat, 9:00 AM–5:00 PM; confirm with the hospital.', sources: [{ label: 'Official contact', url: 'https://kvgmch.org/contact-us/' }, { label: 'OPD hours listing', url: 'https://www.bajajfinservhealth.in/hospitals/dakshina-kannada/k-v-g-medical-college-and-hospital-sullia' }] },
  { name: 'Jyothi Hospital, Sullia', category: 'General Hospitals', location: 'Jyothi Circle, Main Road, Sullia 574239', contact: '08257 230411', hours: 'A listing reports Mon–Sat, 10:00 AM–2:00 PM; confirm directly.', sources: [{ label: 'Hospital contact listing', url: 'https://www.hospitalsnearme.in/karnataka-ka/jyothi-hospital-sullia/' }, { label: 'OPD hours listing', url: 'https://www.practo.com/sullia/hospital/jyothi-hospital-aivernad' }] },
  { name: 'S.V.M. Hospital', category: 'General Hospitals', location: 'Srirampete, Sullia 574239', contact: '08257 230203', hours: 'Not verified; call to confirm.', sources: [{ label: 'Local listing', url: 'https://www.onefivenine.com/india/Listing/Locality/hospitals/Dakshin-Kannad/Sulya/Mangalore-_1a-Mysore-_1a-Bangalore-Highway-Dakshina-Ka' }] },
  { name: 'KVG Dental College & Hospital', category: 'Dental Clinics', location: 'Kurunjibag, Sullia 574327', contact: '08257 235043 (registration)', hours: 'Mon–Fri, 9:00 AM–5:00 PM; Sat, 9:00 AM–1:00 PM; Sun closed.', sources: [{ label: 'Patient services and hours', url: 'https://kvgdentalcollege.org/patient-services/' }] },
  { name: 'KVG Implant Centre', category: 'Dental Clinics', location: '1st Floor, KVG Dental College & Hospital, Kurunjibag, Sullia 574327', contact: '90857 00700', hours: 'Mon–Sat, 9:00 AM–6:00 PM; Sun by appointment.', sources: [{ label: 'Official location', url: 'https://kvgimplantcentre.com/location' }, { label: 'Patient services and hours', url: 'https://kvgdentalcollege.org/patient-services/' }] },
  { name: 'Soonthodu Dental Care', category: 'Dental Clinics', location: 'Sulya Main Road, opposite KSRTC Bus Stand, Sullia 574239', contact: '08105 372717 / 99004 47440', hours: 'Mon–Sat, 9:30 AM–8:00 PM; Sun, 9:30 AM–1:00 PM (directory listing; confirm).', sources: [{ label: 'Business listing', url: 'https://www.bharatibiz.com/en/soonthodu-dental-care-081053-72717' }] },
  { name: 'Shilpa’s Dental Care', category: 'Dental Clinics', location: 'SH 88, Srirampete, Sullia 574239', contact: '09741 810949', hours: 'Not verified; call to confirm.', sources: [{ label: 'Local listing', url: 'https://www.onefivenine.com/india/Listing/Locality/hospitals/Dakshin-Kannad/Sulya/Mangalore-_1a-Mysore-Highway' }] },
  { name: 'Siri Dental Clinic', category: 'Dental Clinics', location: 'Devi Heights, Bellare, Sullia Taluk 574212', contact: 'Not found in the supplied listing.', hours: 'Listing reports Mon–Sat, 10:00 AM–2:00 PM; confirm with the clinic.', sources: [{ label: 'Clinic listing', url: 'https://www.practo.com/sullia/clinic/siri-dental-clinic-2-aivernad/about' }] },
  { name: 'Prasad Netralaya – Sullia', category: 'Eye Clinics', location: '1st Floor, Janatha Complex, Gandhi Nagar, Sullia 574239', contact: '08257 231956 / 87489 38629', hours: 'Hours not published in the source; call to confirm.', sources: [{ label: 'Official branch details', url: 'https://prasadnetralaya.com/contact/' }] },
  { name: 'K.V.G. Medical College & Hospital – Pediatrics', category: 'Pediatric/Children\'s Clinics', location: 'Kurunjibag, Sullia 574327', contact: '08257 230316', hours: 'General OPD reported Mon–Sat, 9:00 AM–5:00 PM; pediatric clinic schedule not verified.', sources: [{ label: 'Official hospital contact', url: 'https://kvgmch.org/contact-us/' }, { label: 'General OPD hours listing', url: 'https://www.bajajfinservhealth.in/hospitals/dakshina-kannada/k-v-g-medical-college-and-hospital-sullia' }] },
  { name: 'Taluk Government Hospital, Sullia – children’s care', category: 'Pediatric/Children\'s Clinics', location: 'Srirampete, NH 275, Sullia 574239', contact: '08257 230479', hours: 'Pediatric clinic schedule not verified.', sources: [{ label: 'Karnataka hospital list', url: 'https://amkresourceinfo.com/wp-content/uploads/2023/03/KASS-Hospital-List.pdf' }] },
  { name: 'Maithri Pediatric Clinic', category: 'Pediatric/Children\'s Clinics', location: 'Kedambady Complex, Shrirampete, Sullia Taluk', contact: 'Not listed in the supplied source.', hours: 'Listing reports Mon–Sat, 10:00 AM–2:00 PM; confirm with the clinic.', sources: [{ label: 'Clinic listing', url: 'https://www.practo.com/sullia/clinic/maithri-pediatric-clinic-aivernad' }] },
  { name: 'K.V.G. Medical College & Hospital – Orthopaedics', category: 'Orthopedics', location: 'Kurunjibag, Sullia 574327', contact: '08257 230316', hours: 'General OPD reported Mon–Sat, 9:00 AM–5:00 PM; orthopaedics schedule not verified.', sources: [{ label: 'Official hospital contact', url: 'https://kvgmch.org/contact-us/' }, { label: 'General OPD hours listing', url: 'https://www.bajajfinservhealth.in/hospitals/dakshina-kannada/k-v-g-medical-college-and-hospital-sullia' }] },
  { name: 'Taluk Government Hospital, Sullia – Orthopaedics', category: 'Orthopedics', location: 'Srirampete, NH 275, Sullia 574239', contact: '08257 230479', hours: 'Clinic schedule not verified.', sources: [{ label: 'Karnataka hospital list', url: 'https://amkresourceinfo.com/wp-content/uploads/2023/03/KASS-Hospital-List.pdf' }] },
  { name: 'K.V.G. Medical College & Hospital', category: 'Emergency Hospitals', location: 'Kurunjibag, Sullia 574327', contact: '08257 230316', availability: 'Listed as open 24 hours with emergency services; call to confirm current availability.', sources: [{ label: 'Official hospital contact', url: 'https://kvgmch.org/contact-us/' }, { label: '24-hour listing', url: 'https://www.bharatibiz.com/en/k-v-g-medical-college-hospital_1a-082572-32608' }] },
  { name: 'Jyothi Hospital, Sullia', category: 'Emergency Hospitals', location: 'Jyothi Circle, Main Road, Sullia 574239', contact: '08257 230411', availability: 'A hospital directory lists 24-hour emergency service; call to confirm current availability.', sources: [{ label: 'Hospital contact listing', url: 'https://www.hospitalsnearme.in/karnataka-ka/jyothi-hospital-sullia/' }, { label: 'Emergency service directory', url: 'https://www.bookmyhealthcare.com/Member/HospitalProfile?Hosp=Jyothi-Hospital&Hosp_Id=20180466' }] },
  { name: 'KVG Ayurveda Medical College & Hospital', category: 'Other Clinics', location: 'Ambatedka, Kurunjibhag, Sullia 574239', contact: '08257 233608 / 233208 / 233808', hours: 'Exact clinic hours not verified; hospital states services are available round the clock.', sources: [{ label: 'Official contact', url: 'https://kvgamch.org/contact-us/' }, { label: 'Hospital services', url: 'https://kvgamch.org/services/' }] },
  { name: 'Shree Clinic', category: 'Other Clinics', location: 'Mangalore–Mysore Highway, Sullia 574239', contact: '09449 373275', hours: 'Not verified; call to confirm.', sources: [{ label: 'Local listing', url: 'https://www.onefivenine.com/india/Listing/Locality/hospitals/Dakshin-Kannad/Sulya/Mangalore-_1a-Mysore-_1a-Bangalore-Highway-Dakshina-Ka' }] },
  { name: 'Krishna Clinic', category: 'Other Clinics', location: 'SH 88, Sullia 574239', contact: '08257 234256', hours: 'Not verified; call to confirm.', sources: [{ label: 'Local listing', url: 'https://www.onefivenine.com/india/Listing/Locality/hospitals/Dakshin-Kannad/Sulya/Mangalore-Mysore-Highway' }] }
];
let state = { ...defaultState, patients: [] };
let queueReady = false;
let registrationPending = false;
let queueHospitals = [];
let activeQueueKey = LEGACY_QUEUE_KEY;

function getQueueHospital(key = activeQueueKey) {
  return queueHospitals.find((hospital) => hospital.key === key);
}

function queueUrl(path, hospitalKey = activeQueueKey) {
  const separator = path.includes('?') ? '&' : '?';
  return `${path}${separator}hospitalKey=${encodeURIComponent(hospitalKey)}`;
}

async function apiRequest(path, options) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, options);
  } catch (error) {
    throw new Error('Cannot connect to the backend. Make sure the website server is running.', { cause: error });
  }

  let result;
  try {
    result = await response.json();
  } catch (error) {
    throw new Error('The backend returned an invalid response.', { cause: error });
  }

  if (!result || typeof result !== 'object') {
    throw new Error('The backend returned an invalid response.');
  }
  if (!response.ok || !result.success) {
    throw new Error(result.message || 'The request could not be completed.');
  }

  return result;
}

function formatToken(token) {
  const number = Number.parseInt(String(token).replace(/\D/g, ''), 10);
  return Number.isInteger(number) && number > 0 ? `T-${String(number).padStart(3, '0')}` : '--';
}

function getWaitingPatients() {
  return state.patients.filter((patient) => patient.status.toLowerCase() === 'waiting');
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
  const activeHospital = getQueueHospital();
  const registrationHospital = document.getElementById('registrationHospital');
  document.getElementById('homeCurrentToken').textContent = current;
  document.getElementById('homeQueueHospital').textContent = activeHospital?.name || 'Legacy / unassigned';
  document.getElementById('homeWaitingCount').textContent = waiting;
  document.getElementById('homeRegisteredCount').textContent = state.patients.length;
  document.getElementById('homeAvgWait').textContent = `${getAverageWait()} min`;
  document.getElementById('adminTotal').textContent = state.patients.length;
  document.getElementById('adminCurrent').textContent = current;
  document.getElementById('adminWaiting').textContent = waiting;
  document.getElementById('adminWait').textContent = `${getAverageWait()} min`;
  document.getElementById('queueStatusBadge').textContent = waiting ? `${waiting} waiting` : 'Queue empty';
  const hasRegistrationHospital = Boolean(registrationHospital.value);
  document.getElementById('currentPatientCount').textContent = hasRegistrationHospital ? state.patients.length : '--';
  document.getElementById('maxTokenCount').textContent = hasRegistrationHospital ? state.maxTokens : '--';
  document.getElementById('remainingTokenCount').textContent = hasRegistrationHospital ? getRemainingTokens() : '--';
  document.getElementById('adminRegisteredCount').textContent = state.patients.length;
  document.getElementById('adminMaxTokenCount').textContent = state.maxTokens;
  document.getElementById('adminRemainingTokenCount').textContent = getRemainingTokens();
  const limitInput = document.getElementById('maxTokenInput');
  if (document.activeElement !== limitInput) {
    limitInput.value = state.maxTokens;
  }
  document.getElementById('registrationLimitMessage').classList.toggle('hidden', !hasRegistrationHospital || getRemainingTokens() > 0);
  document.querySelector('#registrationForm button[type="submit"]').disabled =
    !queueReady || registrationPending || !registrationHospital.value || getRemainingTokens() === 0;
  renderPatientTable();
}

function renderPatientTable() {
  const tableBody = document.getElementById('patientTableBody');
  if (!state.patients.length) {
    tableBody.innerHTML = '<tr><td colspan="5" class="table-empty">No patients registered in this queue yet.</td></tr>';
    return;
  }
  tableBody.innerHTML = state.patients.map((patient) => {
    const status = patient.status;
    return `<tr><td>${formatToken(patient.token)}</td><td>${escapeHtml(patient.name)}<br><span class="patient-status">Age ${escapeHtml(patient.age)} · ${escapeHtml(patient.gender)}</span></td><td>${escapeHtml(patient.department)}</td><td>${escapeHtml(patient.problem)}</td><td><span class="patient-status ${status.toLowerCase()}">${status}</span></td></tr>`;
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
  const hospitalSelect = document.getElementById('registrationHospital');
  const hospitalKey = hospitalSelect.value;
  const submitButton = form.querySelector('button[type="submit"]');
  const result = document.getElementById('registrationResult');
  const name = nameInput.value.trim();
  const ageText = ageInput.value.trim();
  const phone = phoneInput.value.trim();

  nameInput.setCustomValidity('');
  ageInput.setCustomValidity('');
  phoneInput.setCustomValidity('');

  if (!/^[\p{L} ]+$/u.test(name)) {
    nameInput.setCustomValidity('Enter a patient name using letters and spaces only.');
  }
  if (!/^[0-9]+$/.test(ageText) || Number(ageText) < 1 || Number(ageText) > 120) {
    ageInput.setCustomValidity('Enter a valid age from 1 to 120 using numbers only.');
  }
  if (!/^[0-9]{10}$/.test(phone)) {
    phoneInput.setCustomValidity('Enter a phone number containing exactly 10 digits.');
  }
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  if (!queueReady) {
    result.textContent = 'Queue data is unavailable. Please try again when the server is connected.';
    result.classList.remove('hidden');
    return;
  }
  if (getRemainingTokens() === 0) {
    document.getElementById('registrationLimitMessage').classList.remove('hidden');
    return;
  }

  const formData = new FormData(form);
  const patientData = {
    patientName: name,
    patientAge: Number(ageText),
    patientGender: formData.get('patientGender'),
    patientPhone: phone,
    healthProblem: formData.get('healthProblem').trim(),
    department: formData.get('department'),
    hospitalKey
  };
  registrationPending = true;
  submitButton.disabled = true;

  try {
    const registration = await apiRequest('/api/registrations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patientData)
    });
    const token = Number.parseInt(registration.token.tokenNumber, 10);
    const patient = {
      id: registration.patientId,
      tokenId: registration.token.id,
      token,
      name,
      age: patientData.patientAge,
      gender: patientData.patientGender,
      phone,
      problem: patientData.healthProblem,
      department: patientData.department,
      hospitalKey,
      registeredAt: new Date().toISOString(),
      status: 'Waiting'
    };

    if (!Number.isInteger(token) || token < 1) {
      throw new Error('The server returned an invalid token after registration.');
    }

    state.patients.push(patient);
    state.maxTokens = registration.maxTokens;
    updateOverview();
    result.innerHTML = `
      <span class="success-message">Registration successful!</span>
      <span class="token-number">${escapeHtml(formatToken(token))}</span>
      <p>Queue: ${escapeHtml(registration.token.hospitalName)} · Department: ${escapeHtml(patientData.department)}. Keep this token and hospital name to check your status.</p>
    `;
    result.classList.remove('hidden');
    form.reset();
    hospitalSelect.value = hospitalKey;
    updateRegistrationDepartments();
    nameInput.setCustomValidity('');
    ageInput.setCustomValidity('');
    phoneInput.setCustomValidity('');

    refreshQueue(hospitalKey).catch((error) => {
      console.error('Could not refresh queue after registration:', error);
      document.getElementById('adminMessage').textContent = 'Registration saved, but queue totals could not be refreshed.';
      document.getElementById('adminMessage').classList.add('error');
    });
  } catch (error) {
    console.error('Registration error:', error);
    result.innerHTML = `<span class="error-message">Registration failed.</span><p>${escapeHtml(error.message)}</p>`;
    result.classList.remove('hidden');
    if (error.message.includes("queue is full")) {
      try {
        await refreshQueue(hospitalKey);
      } catch (refreshError) {
        console.error('Could not refresh a full queue:', refreshError);
      }
    }
  } finally {
    registrationPending = false;
    updateOverview();
  }
}

async function handleSupportSubmission(event) {
  event.preventDefault();
  const form = event.target;
  const nameInput = document.getElementById('supportName');
  const phoneInput = document.getElementById('supportPhone');
  const otherInput = document.getElementById('supportOther');
  const result = document.getElementById('supportResult');
  const submitButton = form.querySelector('button[type="submit"]');
  nameInput.setCustomValidity('');
  phoneInput.setCustomValidity('');
  otherInput.setCustomValidity('');
  if (!/^[\p{L} ]+$/u.test(nameInput.value.trim())) {
    nameInput.setCustomValidity('Enter a name using letters and spaces only.');
  }
  if (!/^[0-9]{10}$/.test(phoneInput.value.trim())) {
    phoneInput.setCustomValidity('Enter a phone number containing exactly 10 digits.');
  }
  if (document.getElementById('supportIssue').value === 'Other' && !otherInput.value.trim()) {
    otherInput.setCustomValidity('Describe the issue.');
  }
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const formData = new FormData(form);
  const selectedIssue = formData.get('supportIssue');
  const issueType = selectedIssue === 'Other'
    ? `Other: ${formData.get('supportOther').trim()}`
    : selectedIssue;

  submitButton.disabled = true;
  try {
    const response = await apiRequest('/api/support', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: nameInput.value.trim(),
        phone: phoneInput.value.trim(),
        issueType,
        message: formData.get('supportMessage').trim()
      })
    });
    result.textContent = response.message;
    result.classList.remove('hidden');
    form.reset();
    nameInput.setCustomValidity('');
    phoneInput.setCustomValidity('');
    updateSupportOtherField();
  } catch (error) {
    console.error('Support request error:', error);
    result.textContent = error.message;
    result.classList.remove('hidden');
  } finally {
    submitButton.disabled = false;
  }
}

function updateSupportOtherField() {
  const isOther = document.getElementById('supportIssue').value === 'Other';
  const otherWrap = document.getElementById('supportOtherWrap');
  const otherInput = document.getElementById('supportOther');
  otherWrap.classList.toggle('hidden', !isOther);
  otherInput.required = isOther;
}

async function handleStatusLookup(event) {
  event.preventDefault();
  const tokenInput = document.getElementById('statusToken');
  const tokenNumber = Number(tokenInput.value);
  const hospitalKey = document.getElementById('statusHospital').value;
  const result = document.getElementById('statusResult');

  if (!Number.isInteger(tokenNumber) || tokenNumber < 1) {
    tokenInput.setCustomValidity('Enter a valid token number.');
    tokenInput.reportValidity();
    return;
  }

  tokenInput.setCustomValidity('');
  result.textContent = 'Checking queue status...';

  try {
    const data = await apiRequest(queueUrl(`/api/tokens/${encodeURIComponent(String(tokenNumber))}`, hospitalKey));
    const token = data.token;
    const peopleAhead = Number(data.peopleAhead);
    const isServed = token.status.toLowerCase() === 'served';
    result.innerHTML = `
      <div class="status-head">
        <h3>${escapeHtml(token.patient_name)}</h3>
        <span class="status-pill">${isServed ? 'Served' : 'Waiting'}</span>
      </div>
      <div class="status-grid">
        <div class="status-box"><span>Your token</span><strong>${escapeHtml(formatToken(token.token_number))}</strong></div>
        <div class="status-box"><span>Department</span><strong>${escapeHtml(token.department)}</strong></div>
      </div>
      <p class="status-summary">Hospital: ${escapeHtml(getQueueHospital(hospitalKey)?.name || 'Legacy / unassigned registrations')}</p>
      <p class="status-summary">${isServed ? 'This token has already been served.' : `There ${peopleAhead === 1 ? 'is' : 'are'} ${peopleAhead} ${peopleAhead === 1 ? 'person' : 'people'} ahead of you.`}</p>
    `;
  } catch (error) {
    result.textContent = error.message;
  }
}

function renderFacilities(listings = facilities) {
  const facilityGroups = document.getElementById('facilityGroups');
  facilityGroups.innerHTML = facilityCategories.map((category, index) => {
    const categoryFacilities = listings.filter((facility) => facility.category === category);
    const cards = categoryFacilities.length ? categoryFacilities.map((facility) => {
      const sources = (facility.sources || []).map((source) => `<a href="${escapeHtml(source.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(source.label)}</a>`).join(' · ');
      const scheduleLabel = category === 'Emergency Hospitals' ? 'Emergency availability' : 'Opening hours';
      const schedule = category === 'Emergency Hospitals' ? facility.availability : facility.hours;
      return `<article class="facility-card"><span class="facility-demo-label">Sullia directory</span><h4>${escapeHtml(facility.name)}</h4><p><strong>Type</strong>${escapeHtml(facility.category)}</p><p><strong>Location</strong>${escapeHtml(facility.location || 'Not provided')}</p><p><strong>Contact</strong>${escapeHtml(facility.contact || 'Not provided')}</p><p><strong>${scheduleLabel}</strong>${escapeHtml(schedule || 'Not listed; call to confirm.')}</p>${sources ? `<p class="facility-sources"><strong>Source</strong><span>${sources}</span></p>` : ''}</article>`;
    }).join('') : `<p class="facility-empty">${category === 'Emergency Hospitals' ? 'No emergency-designated hospital listing was included. For an emergency in India, call 112.' : category === 'Orthopedics' ? 'No dedicated pediatric orthopaedic clinic listing was verified.' : 'No listings available in this category.'}</p>`;
    const sectionId = category === 'Emergency Hospitals' ? 'facility-category-emergency' : `facility-category-${index}`;
    const categoryNote = category === 'Orthopedics' && categoryFacilities.length ? '<p class="facility-empty">No dedicated pediatric orthopaedic clinic listing was verified.</p>' : '';
    return `<section class="facility-group" id="${sectionId}"><h3>${escapeHtml(category)}</h3><div class="facility-grid">${cards}</div>${categoryNote}</section>`;
  }).join('');
}



async function callNextPatient() {
    const nextPatient = getWaitingPatients().sort((first, second) => first.token - second.token)[0];

    const message = document.getElementById('adminMessage');

    if (!nextPatient) {
        message.textContent = 'There are no waiting patients.';
        message.classList.add('error');
        return;
    }

    try {
        document.getElementById('nextPatientButton').disabled = true;
        await apiRequest(`/api/tokens/${nextPatient.tokenId}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'Served' })
        });

        await refreshQueue();

        message.textContent =
            `${formatToken(nextPatient.token)} is now being served.`;

        message.classList.remove('error');

    } catch (error) {
        console.error('Next patient error:', error);

        message.textContent = error.message;

        message.classList.add('error');
    } finally {
        document.getElementById('nextPatientButton').disabled = false;
    }
}

async function resetQueue() {
  const hospitalName = getQueueHospital()?.name || 'Legacy / unassigned registrations';
  if (state.patients.length && !window.confirm(`Reset the ${hospitalName} queue and remove its patient records? Other hospital queues will not be changed.`)) {
    return;
  }

  const message = document.getElementById('adminMessage');
  const resetButton = document.getElementById('resetQueueButton');
  resetButton.disabled = true;
  try {
    await apiRequest(queueUrl('/api/queue', activeQueueKey), { method: 'DELETE' });
    await refreshQueue(activeQueueKey);
    message.textContent = `${hospitalName} queue reset successfully. The queue limit is back to 50.`;
    message.classList.remove('error');
  } catch (error) {
    console.error('Queue reset error:', error);
    message.textContent = error.message;
    message.classList.add('error');
  } finally {
    resetButton.disabled = false;
  }
}

async function refreshQueue(hospitalKey = activeQueueKey) {
  const [tokensResult, queueResult] = await Promise.all([
    apiRequest(queueUrl('/api/tokens', hospitalKey)),
    apiRequest(queueUrl('/api/queue', hospitalKey))
  ]);
  if (hospitalKey !== activeQueueKey) {
    return state;
  }
  if (!Array.isArray(tokensResult.tokens)) {
    throw new Error('The backend returned an invalid token list.');
  }

  state.patients = tokensResult.tokens.map((token) => {
    const tokenNumber = Number.parseInt(String(token.token_number).replace(/\D/g, ''), 10);
    const status = String(token.status || '');
    if (!Number.isInteger(tokenNumber) || tokenNumber < 1 || !['waiting', 'served'].includes(status.toLowerCase())) {
      throw new Error(`The backend returned invalid queue data for token ${token.token_number}.`);
    }

    return {
      id: token.patient_id,
      tokenId: token.id,
      token: tokenNumber,
      name: token.patient_name,
      age: token.age,
      gender: token.gender,
      phone: token.phone,
      problem: token.health_problem,
      department: token.department,
      hospitalKey: token.hospital_key || LEGACY_QUEUE_KEY,
      hospitalName: getQueueHospital(token.hospital_key || LEGACY_QUEUE_KEY)?.name || 'Legacy / unassigned registrations',
      registeredAt: token.created_at,
      status: status[0].toUpperCase() + status.slice(1).toLowerCase()
    };
  }).sort((first, second) => first.token - second.token);

  state.currentToken = Number(queueResult.queue.current_token);
  state.maxTokens = Number(queueResult.queue.max_tokens);
  if (!Number.isInteger(state.currentToken) || !Number.isInteger(state.maxTokens)) {
    throw new Error('The backend returned invalid queue settings.');
  }
  queueReady = true;
  updateOverview();
  return state;
}

async function initializeQueue() {
  const message = document.getElementById('adminMessage');
  try {
    const result = await apiRequest('/api/queue/hospitals');
    if (!Array.isArray(result.hospitals) || !result.hospitals.length) {
      throw new Error('The backend did not return any selectable hospitals.');
    }
    queueHospitals = result.hospitals;
    const registrationSelect = document.getElementById('registrationHospital');
    const statusSelect = document.getElementById('statusHospital');
    const adminSelect = document.getElementById('adminHospital');
    [registrationSelect, statusSelect, adminSelect].forEach((select) => {
      const groups = new Map();
      queueHospitals.forEach((hospital) => {
        if (!groups.has(hospital.category)) {
          const group = document.createElement('optgroup');
          group.label = hospital.category;
          groups.set(hospital.category, group);
          select.append(group);
        }
        const option = document.createElement('option');
        option.value = hospital.key;
        option.textContent = hospital.name;
        groups.get(hospital.category).append(option);
      });
    });
    [statusSelect, adminSelect].forEach((select) => {
      const option = document.createElement('option');
      option.value = LEGACY_QUEUE_KEY;
      option.textContent = 'Legacy / unassigned registrations';
      select.append(option);
    });
    adminSelect.value = LEGACY_QUEUE_KEY;
    await refreshQueue(LEGACY_QUEUE_KEY);
    message.textContent = '';
    message.classList.remove('error');
  } catch (error) {
    console.error('Queue initialization error:', error);
    queueReady = false;
    updateOverview();
    message.textContent = error.message;
    message.classList.add('error');
  }
}

function updateRegistrationDepartments() {
  const hospitalKey = document.getElementById('registrationHospital').value;
  const departmentSelect = document.getElementById('department');
  const hospital = getQueueHospital(hospitalKey);
  departmentSelect.replaceChildren(new Option(
    hospital ? 'Choose a department' : 'Choose a hospital first',
    ''
  ));
  if (!hospital) {
    departmentSelect.disabled = true;
    return;
  }
  hospital.departments.forEach((department) => departmentSelect.add(new Option(department, department)));
  departmentSelect.disabled = false;
}

async function selectActiveQueue(hospitalKey) {
  const message = document.getElementById('adminMessage');
  activeQueueKey = hospitalKey;
  queueReady = false;
  updateOverview();
  try {
    await refreshQueue(hospitalKey);
    message.textContent = '';
    message.classList.remove('error');
  } catch (error) {
    console.error('Could not load selected hospital queue:', error);
    message.textContent = error.message;
    message.classList.add('error');
  }
}

document.querySelectorAll('[data-view]').forEach((button) => button.addEventListener('click', () => showView(button.dataset.view, button.dataset.target)));
document.getElementById('registrationForm').addEventListener('submit', handleRegistration);
document.getElementById('registrationHospital').addEventListener('change', (event) => {
  updateRegistrationDepartments();
  const hospitalKey = event.target.value;
  if (!hospitalKey) {
    document.getElementById('adminHospital').value = LEGACY_QUEUE_KEY;
    selectActiveQueue(LEGACY_QUEUE_KEY);
    return;
  }
  document.getElementById('adminHospital').value = hospitalKey;
  selectActiveQueue(hospitalKey);
});
document.getElementById('adminHospital').addEventListener('change', (event) => {
  const hospitalKey = event.target.value;
  const registrationSelect = document.getElementById('registrationHospital');
  registrationSelect.value = hospitalKey === LEGACY_QUEUE_KEY ? '' : hospitalKey;
  updateRegistrationDepartments();
  selectActiveQueue(hospitalKey);
});
document.getElementById('statusForm').addEventListener('submit', handleStatusLookup);
document.getElementById('supportForm').addEventListener('submit', handleSupportSubmission);
document.getElementById('supportIssue').addEventListener('change', updateSupportOtherField);
document.getElementById('limitForm').addEventListener('submit', async (event) => {
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
  try {
    const result = await apiRequest('/api/queue/limit', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ maxTokens: newLimit, hospitalKey: activeQueueKey })
    });
    state.maxTokens = result.maxTokens;
    await refreshQueue(activeQueueKey);
    message.textContent = `Queue registration limit for ${getQueueHospital()?.name || 'legacy queue'} set to ${result.maxTokens}.`;
    message.classList.remove('error');
  } catch (error) {
    message.textContent = error.message;
    message.classList.add('error');
  }
});
document.getElementById('maxTokenInput').addEventListener('input', (event) => event.target.setCustomValidity(''));
document.getElementById('nextPatientButton').addEventListener('click', callNextPatient);
document.getElementById('resetQueueButton').addEventListener('click', resetQueue);
renderFacilities();
updateSupportOtherField();
updateRegistrationDepartments();
document.getElementById('todayDate').textContent = new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date());
updateOverview();
initializeQueue();
window.setInterval(() => {
  refreshQueue(activeQueueKey).catch((error) => {
    console.error('Queue refresh error:', error);
    queueReady = false;
    updateOverview();
    const message = document.getElementById('adminMessage');
    message.textContent = 'Live queue updates are unavailable. Check the server connection.';
    message.classList.add('error');
  });
}, 15000);