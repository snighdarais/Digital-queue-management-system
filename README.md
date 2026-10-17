# Digital Queue Management System for Health Camps

A small health-camp queue application with an HTML/CSS/JavaScript frontend, an Express API, and a SQLite database.

## Project files

- `frontend/index.html` - page structure and the Home, Registration, Queue Status, Hospitals & Clinics, Emergency, Customer Support and Admin views.
- `frontend/style.css` - responsive healthcare-themed styling.
- `frontend/script.js` - registration, queue status, queue controls and support-request logic.
- `backend/app.js` - API routes and static hosting for the frontend.
- `backend/server.js` - server startup and graceful shutdown.
- `backend/database.js` - SQLite connection and schema initialization.
- `database/database.sql` - database schema.
- `backend/server.test.js` - automated API integration tests.
- `database/queue_management.db` - local database created and updated when the server runs.

## How to run in VS Code

1. Install [Node.js](https://nodejs.org/) (version 20.17 or later).
2. Open a terminal in the project folder and install the backend dependencies:

   ```powershell
   npm --prefix backend install
   ```

3. Start the website and API:

   ```powershell
   npm --prefix backend start
   ```

4. Open <http://localhost:5000> in your browser. Keep the terminal open while using the website.

The server initializes the SQLite schema automatically. The frontend is served by the same server as the API; opening `frontend/index.html` directly with a `file://` URL will not connect to the API.

The server binds to `127.0.0.1` by default so the demo is reachable only from this computer. This project does not implement user accounts, admin authorization, or encrypted patient-data storage; Admin controls are not password-protected. Use test data only, do not expose it to a network, and do not use it for real patient records.

Run the automated API and syntax checks with:

```powershell
npm --prefix backend test
```

## How the token system works

- Patients select from the 14 unique hospitals and clinics in the Sullia directory before registering. Repeated directory entries for the same hospital (for example its emergency, pediatric, or orthopaedic listing) share one selectable queue rather than creating duplicate queues.
- Department choices are filtered by the selected facility category. General hospitals include General Medicine, Eye Care, Skin / Dermatology, Dental Care, Pediatrics, Orthopedics, Women's Health, ENT, Cardiology, General Surgery, and Other / Not Listed. Specialty clinics show their relevant department plus Other / Not Listed. Departments are routing labels only; patients should call to confirm a facility actually provides the service.
- Each hospital has an independent token sequence, queue registration limit (default 50), waiting count, and current token. The limit does not renew automatically at midnight; staff must reset the queue when starting a new camp/session. Tokens can repeat between hospitals, so queue lookup requires both the hospital and token number.
- Registration saves the patient and hospital-specific token together in SQLite. Backend validation enforces the selected hospital’s department list and queue capacity.
- **Admin** lets staff select a hospital, review that queue, call the next patient, change that hospital's limit, or reset only that hospital's queue.
- Resetting a queue permanently deletes patient and token records in that queue and restores its limit to 50. There is no undo; support and emergency requests remain.
- The previous queue remains available in Admin as **Legacy / unassigned registrations**. Existing patients and tokens are preserved as legacy records by the automatic schema migration; they are not assigned to a facility.
- Support and emergency requests are not removed when any hospital queue is reset.
- Patient, token, queue-limit, support-request, and emergency-request data are stored in SQLite and persist across page refreshes.
- Customer support requests are saved in the database, but this project demo does not send alerts or provide real-time monitoring.
- The Hospitals & Clinics directory shows Sullia facilities, reported hours, contacts, and source links supplied for the project. Listings are not independently verified; call facilities to confirm details.
- The Emergency section tells patients not to wait for a normal token and provides India's 112 number. Patients elsewhere should use their local emergency number.

## Validation

- Patient names accept letters and spaces only. Ages must be whole numbers from 1 to 120. Patient and support phone numbers must contain exactly 10 digits.
- Required fields are checked before submissions are saved.
- The server validates requests too, limits request body size, and returns JSON errors for invalid API requests.

## Test checklist

1. Open **Get Token**, select a hospital, and confirm the department choices update. Register a patient and note the hospital and token number.
2. Register another patient at that hospital and use **Check queue** with that hospital and token; confirm the waiting position.
3. Register a patient at another hospital and confirm the new hospital starts an independent token sequence.
4. Open **Admin**, select each hospital, and confirm the patient list, counters, call-next action, token limit, and reset apply only to that hospital.
5. Select **Legacy / unassigned registrations** in Admin and confirm previous registrations remain accessible without being assigned to a hospital.
6. Refresh the page and confirm hospital queue records persist.
7. Submit a support request and verify the confirmation; confirm a row was added to the `support_requests` table in SQLite.
8. Visit Hospitals & Clinics and Emergency to review the sourced listings and emergency guidance. Check the page at desktop and mobile widths.