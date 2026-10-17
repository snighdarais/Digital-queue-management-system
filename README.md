# Digital Queue Management System for Health Camps

A simple college project built with HTML, CSS and JavaScript. It manages patient tokens in the browser using `localStorage`; no server or database is required.

## Project files

- `frontend/index.html` - page structure and the Home, Registration, Queue Status, Hospitals & Clinics, Emergency, Customer Support and Admin views.
- `frontend/style.css` - responsive healthcare-themed styling.
- `frontend/script.js` - registration, token generation, queue controls and localStorage logic.
- `backend/`, `database/`, `docs/` - folders reserved for future project expansion.

## How to run in VS Code

1. Open the `Digital-queue-management-system` folder in VS Code.
2. Open `frontend/index.html` in a browser, or install the Live Server extension and choose **Open with Live Server**.
3. Use the navigation buttons to move between the patient and admin views.

No `npm install` or backend setup is needed.

## How the token system works

- Each new patient receives the next number in sequence, displayed as `T-001`, `T-002`, and so on.
- Registration stores the patient record and the next token number in the browser's localStorage.
- **Check queue** finds a patient by token and counts registered tokens before it that have not been served.
- **Call next patient** moves `currentToken` to the next waiting token and refreshes every queue view.
- The daily token limit defaults to 50 and can be changed from Admin. The limit and registered-patient count are shown on the registration page; registration stops at the limit.
- **Reset queue** removes today's patient records, restores the default limit, and starts again at `T-001` after confirmation. Support requests are stored separately and are not removed by this action.
- Data remains after a page refresh in the same browser until the queue is reset or browser storage is cleared.
- Customer support requests are saved in the browser under a separate localStorage key. They are not transmitted to a support team.
- The Hospitals & Clinics directory uses clearly marked demo listings with no invented addresses or contact details; its category/name/location/contact data shape can be replaced with verified places API results later.
- The Emergency section tells patients not to wait for a normal token and provides India's 112 number. Patients elsewhere should use their local emergency number.

## Validation

- Patient names accept letters and spaces only. Ages must be whole numbers from 1 to 120. Patient and support phone numbers must contain exactly 10 digits.
- Required fields are checked before submissions are saved.

## Test checklist

1. Open **Get Token**, complete all fields, and register a patient. Confirm the success message and token appear. Try a name with digits, an invalid age, and a phone number that is not exactly 10 digits.
2. Register a second patient. Use **Check queue** with the second token and confirm the first patient is shown as ahead.
3. Open **Admin**, confirm the totals and patient table, then click **Call next patient**. Change the token limit and check that registration closes at the configured maximum.
4. Check the first token again and confirm it is marked as served. Check the second token and confirm its waiting count changed.
5. Refresh the page and confirm the records remain.
6. Use **Reset queue** and confirm the table and counters return to zero.
7. Submit a support request and verify the confirmation; inspect the browser's `queueCareSupportRequests` localStorage entry.
8. Visit Hospitals & Clinics and Emergency, confirming the six sample facility categories and emergency guidance appear. Check the page at desktop and mobile widths.