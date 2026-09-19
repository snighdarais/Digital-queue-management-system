# Digital Queue Management System for Health Camps

A simple college project built with HTML, CSS and JavaScript. It manages patient tokens in the browser using `localStorage`; no server or database is required.

## Project files

- `frontend/index.html` - page structure and the Home, Registration, Queue Status and Admin views.
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
- **Reset queue** removes today's patient records and starts again at `T-001` after confirmation.
- Data remains after a page refresh in the same browser until the queue is reset or browser storage is cleared.

## Test checklist

1. Open **Get a token**, complete all fields, and register a patient. Confirm the success message and token appear.
2. Register a second patient. Use **Check queue** with the second token and confirm the first patient is shown as ahead.
3. Open **Admin**, confirm the totals and patient table, then click **Call next patient**.
4. Check the first token again and confirm it is marked as served. Check the second token and confirm its waiting count changed.
5. Refresh the page and confirm the records remain.
6. Use **Reset queue** and confirm the table and counters return to zero.