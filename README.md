# Credit Card Payment System

A full-stack **Credit Card Payment System** built using **React, Tailwind CSS, Django REST Framework, FastAPI, MySQL 8, and Docker Compose**.

This project simulates credit card payments without connecting to a real payment gateway. It provides authentication, card management, payment processing, transaction history, user dashboards, administrative management, fraud detection and alerts, API documentation, API testing, and Docker-based development.

> **Important:** This README documents the intended system. Verify each feature and endpoint against the actual source code before claiming it is implemented and tested.

---

# 1. Project Overview

The system is divided into multiple application layers:

- **React + Tailwind CSS** — Frontend user interface.
- **Django + Django REST Framework** — Authentication, card management, transaction management, and administration.
- **FastAPI** — Payment processing and dashboard summary service.
- **MySQL 8** — Relational database.
- **Docker Compose** — Containerized development environment.

## Architecture

```text
                         USER
                           |
                           v
                  React + Tailwind CSS
                       Port 5173
                           |
             JWT Authentication / API Requests
                           |
                           v
                  Django REST API
                       Port 8000
                           |
             +-------------+-------------+
             |             |             |
             v             v             v
      Authentication  Card Management  Transactions
                                           |
                                  Fraud Detection
                                           |
                                           v
                                    FastAPI Service
                                       Port 8001
                                           |
                             +-------------+-------------+
                             |                           |
                             v                           v
                      Payment Processing          Dashboard Summary
                             |                           |
                             +-------------+-------------+
                                           |
                                           v
                                         MySQL
                                       Port 3306
```

---

# 2. Payment Flow

```text
React Frontend
      |
      | JWT + Payment Request
      v
Django Backend
      |
      | Validate User, Card and Amount
      v
FastAPI Payment Service
      |
      | Create PENDING Payment
      |
      | Simulate Payment
      v
SUCCESS / FAILED
      |
      v
Django Transaction
      |
      +----> Fraud Detection
      |
      +----> Alert Notification, if configured
      |
      v
MySQL
      |
      v
React Frontend
```

The precise order of transaction creation, fraud evaluation, and payment processing must match the implemented views and services.

---

# 3. Dashboard Flow

```text
React Dashboard
      |
      | GET /dashboard/summary
      | Authorization: Bearer JWT
      v
FastAPI
      |
      | Validate JWT
      |
      +---- Count Transactions
      |
      +---- SUM Successful Transaction Amounts
      |
      +---- Calculate Current Month Spending
      |
      +---- Calculate Available Credit
      |
      +---- Get Last 5 Transactions
      |
      v
MySQL
      |
      +---- transactions_transaction
      |
      +---- cards_card
      |
      v
Dashboard JSON Response
      |
      v
React Dashboard UI
```

---

# 4. Main Features

## Authentication

- User registration.
- User login.
- JWT access token.
- JWT refresh token.
- Protected APIs.
- Logout.
- Password hashing.
- Current-user API.
- Admin authentication.

## Card Management

- Add credit card.
- View saved cards.
- Delete card.
- User-specific cards.
- Card-number validation.
- Expiry validation.
- CVV validation.
- Masked card number.
- Last-four-digits storage.
- Credit limit.

### Card Security

Example:

```text
Submitted card number:
4111111111111111

Displayed masked card:
**** **** **** 1111

Stored last four:
1111
```

The application must not store the full card number or CVV. The example number is illustrative test data only.

## Payment Management

- Simulated payment processing.
- `PENDING`, `SUCCESS`, and `FAILED` statuses.
- Payment history.
- Transaction filters.
- User-specific transaction access.
- Admin transaction management.
- CSV export.
- Daily payment summary.

## Fraud Detection and Alerts

- Evaluate suspicious transaction patterns.
- Flag suspicious transactions.
- Store the fraud reason and status.
- Display flagged transactions in the admin dashboard.
- Send email alerts if the notification service is configured and working.

---

# 5. User Dashboard

The dashboard displays:

1. Total successful spending.
2. Available credit.
3. Total successful transactions.
4. Current-month spending.
5. Last five transactions.

## Dashboard API

```http
GET http://localhost:8001/dashboard/summary
Authorization: Bearer <access_token>
```

## Example Response

```json
{
  "total_transactions": 5,
  "total_amount_spent": 2500.00,
  "current_month_spending": 1500.00,
  "available_credit_limit": 47500.00,
  "last_5_transactions": [
    {
      "amount": 500.00,
      "masked_card_number": "**** **** **** 1111",
      "date": "2026-10-07T10:20:00",
      "status": "SUCCESS"
    },
    {
      "amount": 250.00,
      "masked_card_number": "**** **** **** 1111",
      "date": "2026-10-06T15:30:00",
      "status": "SUCCESS"
    }
  ]
}
```

This is example data, not a live response from the database. Actual field names must match the FastAPI response schema.

## Dashboard Statistics

### Total Transactions

If counting successful transactions only:

```sql
SELECT COUNT(id)
FROM transactions_transaction
WHERE user_id = ?
  AND status = 'SUCCESS';
```

### Total Amount Spent

```sql
SELECT SUM(amount)
FROM transactions_transaction
WHERE user_id = ?
  AND status = 'SUCCESS';
```

### Current-Month Spending

Calculate the sum of successful transactions created during the current calendar month.

### Available Credit

```text
Available Credit = Credit Limit - Relevant Successful Spending
```

For example:

```text
Credit Limit = ₹50,000
Total Spent  = ₹2,500
Available    = ₹47,500
```

When users have multiple cards, calculate the available credit per card or define a correct aggregate rule. Do not subtract all account spending from an arbitrary card's credit limit.

### Last Five Transactions

Retrieve the latest five transactions in descending creation-date order. Return only the fields needed by the frontend.

---

# 6. Dashboard UI

The React dashboard contains four statistic cards:

```text
+----------------------+  +----------------------+
| Total Spent          |  | Available Credit     |
| ₹2,500.00            |  | ₹47,500.00           |
+----------------------+  +----------------------+

+----------------------+  +----------------------+
| Total Transactions   |  | This Month Spending  |
| 5                    |  | ₹1,500.00            |
+----------------------+  +----------------------+
```

The recent-transactions table displays amount, status, date, and masked card number.

## Loading State

Display skeletons while the dashboard request is running to prevent a blank screen and provide visual feedback.

## Error Handling

- `401 Unauthorized`: token missing, invalid, or expired.
- `403 Forbidden`: authenticated user lacks the required permission.
- Other errors: show a useful message and provide a retry option.

---

# 7. Dashboard Security

The dashboard requires a validated JWT:

```http
GET /dashboard/summary
Authorization: Bearer <access_token>
```

FastAPI must validate the token and derive the authenticated user ID from its trusted claims. It must not trust an arbitrary user ID supplied by the client.

Dashboard queries must be scoped to the authenticated user.

---

# 8. Payment Processing

Payment lifecycle:

```text
PENDING
   |
   +----> SUCCESS
   |
   +----> FAILED
```

For a demonstration-only simulation, the application may use deterministic rules such as:

```text
Even amount -> SUCCESS
Odd amount  -> FAILED
```

This is not a real payment-processing rule and must not be presented as fraud detection.

No real payment gateway is connected.

## FastAPI Payment Endpoint

Intended endpoint:

```http
POST http://localhost:8001/payments/
```

Example request, if it matches the implemented schema:

```json
{
  "user_id": 1,
  "card_id": 1,
  "amount": 500
}
```

For secure authorization, the service should derive user identity from a validated token rather than trust the client-provided `user_id`.

---

# 9. Transaction Management

Intended transaction-history endpoint:

```http
GET http://localhost:8000/api/payments/history/
```

Example filters:

```text
/api/payments/history/
/api/payments/history/?status=SUCCESS
/api/payments/history/?status=FAILED
/api/payments/history/?min_amount=100&max_amount=1000
/api/payments/history/?start_date=2026-10-01&end_date=2026-10-31
```

Supported filters should include status, minimum amount, maximum amount, start date, end date, and combined filters, provided they are implemented in the current endpoint.

Users must only be able to view their own transactions.

---

# 10. Admin Features

Admin users can:

- View users.
- View cards.
- View transactions.
- View successful payments.
- View failed payments.
- View pending payments.
- View payment totals.
- Export transactions as CSV.
- View daily payment summaries.
- Search and filter transactions.
- View fraud alerts when enabled.

Django Admin:

```text
http://localhost:8000/admin/
```

Admin APIs must enforce permissions on the backend, not just hide buttons in React.

---

# 11. CSV Export

Intended endpoint:

```http
GET http://localhost:8000/api/payments/transactions/admin/export/
```

Expected fields may include:

```text
Transaction ID
Username
Email
Masked Card
Amount
Status
Payment ID
Created At
```

Only masked card information should be exported.

The endpoint must verify admin permission before returning transaction data.

---

# 12. Daily Payment Summary

The daily summary may contain:

```text
Date
Total Payments
Successful Payments
Failed Payments
Pending Payments
Total Amount
```

Example:

```text
Date        Total   Success   Failed   Pending   Amount
2026-10-01    10       7        2        1      ₹5000
```

Intended endpoint from the existing project documentation:

```text
http://localhost:8000/api/admin/summary/
```

Verify the route against `django_backend/config/urls.py` and the relevant application URL configuration.

---

# 13. Fraud Detection and Alerts

The project includes fraud detection for suspicious transaction patterns when the relevant service is enabled.

Example:

```text
Transaction ID: 37
Amount: ₹6,000.00
Fraud Status: FLAGGED
Reason: Multiple high-value transactions within 10 minutes
```

The transaction model may contain:

```text
fraud_status
fraud_reason
fraud_detected_at
```

## Admin Fraud Alerts API

If the fraud-alert API implementation is installed, the intended endpoint is:

```http
GET http://localhost:8000/api/payments/fraud/alerts/
Authorization: Bearer <admin_access_token>
```

The response can use this structure:

```json
{
  "count": 1,
  "alerts": [
    {
      "id": 37,
      "username": "testuser",
      "amount": "6000.00",
      "status": "SUCCESS",
      "fraud_status": "FLAGGED",
      "fraud_reason": "Multiple high-value transactions within 10 minutes",
      "created_at": "2026-10-09T19:31:20.298350+00:00"
    }
  ]
}
```

This is an example of the response format, not a promise that the endpoint is already registered.

## React Fraud Alerts Component

If `frontend/src/components/FraudAlerts.jsx` is present, it can display:

- Total flagged transactions.
- Transaction ID.
- Username.
- Amount.
- Fraud reason.
- Payment status.
- Refresh button.
- Loading and error states.

In `AdminDashboard.jsx`, the component can be imported as:

```jsx
import FraudAlerts from "../components/FraudAlerts.jsx";
```

Place it above the analytics section:

```jsx
<section className="w-full min-w-0">
  <FraudAlerts />
</section>

<section className="w-full min-w-0 space-y-8">
  <AnalyticsDashboard />
</section>
```

Keep existing dashboard sections and imports. Do not replace the complete admin dashboard with this snippet.

## Email Notifications

Flagging a transaction does not prove an email was delivered. Verify:

1. The fraud evaluation returns a flag.
2. The notification function is called.
3. Email settings are correctly configured.
4. The recipient address is valid.
5. Django logs contain no delivery errors.
6. The test email is received, or delivery is otherwise confirmed.

---

# 14. Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React |
| Styling | Tailwind CSS |
| Build Tool | Vite |
| Backend 1 | Django |
| API Framework | Django REST Framework |
| Authentication | JWT |
| Backend 2 | FastAPI |
| ORM | Django ORM and SQLAlchemy, where used |
| Database | MySQL 8 |
| API Documentation | drf-spectacular and FastAPI OpenAPI |
| API Testing | Postman |
| Containerization | Docker |
| Orchestration | Docker Compose |
| Languages | Python and JavaScript |

---

# 15. Project Structure

```text
credit-card-payment-system/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AnalyticsDashboard.jsx
│   │   │   ├── TransactionSearch.jsx
│   │   │   ├── ThemeToggle.jsx
│   │   │   └── FraudAlerts.jsx
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Cards.jsx
│   │   │   ├── Payment.jsx
│   │   │   ├── Transactions.jsx
│   │   │   └── AdminDashboard.jsx
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   ├── vite.config.js
│   ├── Dockerfile
│   └── .dockerignore
│
├── django_backend/
│   ├── config/
│   │   ├── settings.py
│   │   ├── urls.py
│   │   ├── wsgi.py
│   │   └── asgi.py
│   ├── accounts/
│   ├── cards/
│   ├── transactions/
│   │   └── templates/
│   │       └── transactions/
│   │           └── daily_payment_summary.html
│   ├── notifications/
│   ├── manage.py
│   ├── requirements.txt
│   └── Dockerfile
│
├── fastapi_backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── database.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   ├── auth.py
│   │   └── routes/
│   │       └── dashboard.py
│   ├── requirements.txt
│   └── Dockerfile
│
├── database/
│   └── credit_card_db.sql
├── Screenshots/
├── docker-compose.yml
├── .env
├── .env.example
├── .gitignore
└── README.md
```

This structure is a reference. Preserve actual filenames and modules in the existing repository; do not create duplicate apps merely to match the example.

---

# 16. Database Design

Database name:

```text
credit_card_db
```

Expected tables include:

```text
accounts_user
cards_card
transactions_transaction
```

A separate payments table may also exist, depending on the FastAPI implementation. Django additionally creates framework tables for authentication, permissions, sessions, and admin functionality.

## Users Table

Typical fields:

```text
id
username
email
password
first_name
last_name
is_staff
is_superuser
created_at
updated_at
```

Passwords must be stored as Django password hashes.

## Cards Table

Typical fields:

```text
id
user_id
card_holder_name
masked_card_number
last_four
expiry_month
expiry_year
credit_limit
created_at
```

The actual card number and CVV must not be stored.

## Transactions Table

Typical fields:

```text
id
user_id
card_id
amount
status
payment_id
created_at
fraud_status
fraud_reason
fraud_detected_at
```

Fraud fields are present only if implemented in the actual model and migrations.

## Payments Table

If FastAPI maintains a separate payment record:

```text
id
user_id
card_id
amount
status
created_at
```

If two services maintain separate transaction/payment records, define which table is authoritative and how status changes are synchronized.

---

# 17. Module 1 — Django Authentication

Intended endpoints:

```text
POST /api/accounts/register/
POST /api/accounts/login/
POST /api/accounts/token/refresh/
GET  /api/accounts/me/
POST /api/accounts/logout/
```

Features:

- Registration.
- Login.
- JWT authentication.
- Token refresh.
- Password hashing.
- Protected APIs.
- Current-user API.
- Admin authentication.

Check `django_backend/accounts/urls.py` for the exact paths.

---

# 18. Module 2 — Card Management

Features:

- Add card.
- View saved cards.
- Delete card.
- Mask card number.
- Store last four digits.
- Credit limit.
- CVV validation without storage.
- Expiry validation.
- User-specific card access.

The backend must enforce ownership and validate all submitted data.

---

# 19. Module 3 — FastAPI Payment Processing

Intended endpoint:

```text
POST /payments/
```

Example body:

```json
{
  "user_id": 1,
  "card_id": 1,
  "amount": 500
}
```

The actual body must match the implemented FastAPI schema. In secure designs, authenticated identity should come from a verified token rather than a client-supplied user ID.

---

# 20. Module 4 — Transaction Management

Intended endpoint:

```text
GET /api/payments/history/
```

Supported filters, when implemented:

```text
status
min_amount
max_amount
start_date
end_date
```

Verify the filter implementation and date format before submitting the API documentation.

---

# 21. Module 5 — Admin Management

Django Admin:

```text
http://localhost:8000/admin/
```

Admin features:

```text
Users
Cards
Transactions
Payment records, if configured
Daily payment summary
CSV export
Fraud alerts, if configured
```

Administrative APIs must enforce staff/admin permissions.

---

# 22. Module 6 — React Frontend

The React application contains:

```text
Login
Register
Dashboard
Cards
Payment
Transaction History
Admin Dashboard
Analytics
Transaction Search
Theme Toggle
Fraud Alerts, if enabled
```

User flow:

```text
Register
   ↓
Login
   ↓
Dashboard
   ↓
Add Card
   ↓
Make Payment
   ↓
Payment Result
   ↓
Transaction History
```

---

# 23. Module 7 — MySQL Database

Database:

```text
credit_card_db
```

Application user:

```text
credit_app
```

Docker service:

```text
mysql
```

Inside Docker, applications should normally use:

```env
DB_HOST=mysql
DB_PORT=3306
```

They should not use `localhost` to connect to a different container. A process running directly on Windows should use the published host port.

---

# 24. Module 8 — Security

The application should implement and verify:

### Password Hashing

Passwords must not be stored in plain text.

### JWT Authentication

Protected endpoints require:

```http
Authorization: Bearer <access_token>
```

### Card Security

- Do not store CVV.
- Do not store the complete card number.
- Store masked card information and last four digits only.
- Avoid logging sensitive card data.

### Input Validation

Validate:

```text
Username
Email
Password
Card Data
CVV
Expiry
Amount
```

### ORM Security

Use Django ORM and SQLAlchemy query mechanisms where applicable.

### User Data Isolation

Users may access only their own cards, transactions, and dashboard data.

### Admin Authorization

Administrative endpoints must reject non-admin users.

### Secrets

Never commit real `.env` credentials, active JWTs, or email passwords to GitHub.

---

# 25. Module 9 — API Documentation

## Django Swagger

```text
http://localhost:8000/api/docs/
```

## Django OpenAPI Schema

```text
http://localhost:8000/api/schema/
```

These routes require `drf-spectacular` to be installed and configured.

## FastAPI Swagger

```text
http://localhost:8001/docs
```

## FastAPI ReDoc

```text
http://localhost:8001/redoc
```

---

# 26. Module 10 — Docker

Docker Compose is intended to run:

```text
Docker Compose
│
├── frontend
│   └── React :5173
│
├── django
│   └── Django :8000
│
├── fastapi
│   └── FastAPI :8001
│
└── mysql
    └── MySQL :3306
```

Start the project:

```powershell
cd C:\credit-card-payment-system
docker compose config
docker compose up -d --build
docker compose ps
```

Verify that all four services are actually configured and running.

Stop the services:

```powershell
docker compose down
```

This stops and removes containers but normally preserves named volumes.

---

# 27. Module 11 — Testing

## Authentication

```text
Registration
Login
Invalid Login
JWT
Protected APIs
Logout
```

## Cards

```text
Add Card
View Cards
Delete Card
Invalid Card Data
Invalid CVV
Invalid Expiry
Ownership Validation
```

## Payments

```text
Successful Payment
Failed Payment
Pending Payment
Invalid Amount
Invalid Card
Unauthorized Payment
```

## Transactions

```text
History
Status Filter
Amount Filter
Date Filter
Combined Filter
Ownership Validation
```

## Dashboard

```text
Dashboard Summary
Valid JWT
Invalid JWT
Total Transactions
Total Amount
Current Month Spending
Available Credit
Last 5 Transactions
```

## Admin and Fraud Alerts

```text
Admin Authorization
CSV Export
Daily Summary
Fraud Detection
Fraud Alerts API
Email Delivery, if configured
```

Run checks:

```powershell
docker compose exec django python manage.py check
docker compose exec django python manage.py test
```

Run frontend linting only if the script exists:

```powershell
docker compose exec frontend npm run lint
```

Measure test coverage using the project's configured coverage tool. Do not claim 50% coverage without a report confirming it.

---

# 28. Module 12 — Postman Testing

Recommended Postman collection:

```text
credit-card-payment-system
│
├── Authentication
│   ├── Register
│   ├── Login
│   ├── Me
│   ├── Refresh Token
│   └── Logout
│
├── Cards
│   ├── Add Card
│   ├── My Cards
│   └── Delete Card
│
├── Payments
│   ├── Make Payment - SUCCESS
│   ├── Make Payment - FAILED
│   └── Invalid Amount
│
├── Transactions
│   ├── Transaction History
│   ├── SUCCESS Filter
│   ├── FAILED Filter
│   ├── Amount Filter
│   ├── Date Filter
│   └── Combined Filter
│
├── Dashboard
│   └── Dashboard Summary
│
└── Admin
    ├── CSV Export
    ├── Daily Payment Summary
    └── Fraud Alerts, if configured
```

Dashboard request:

```http
GET http://localhost:8001/dashboard/summary
Authorization: Bearer {{access_token}}
```

Expected responses:

```text
200 OK      Valid authentication
401         Missing or invalid token
403         Authenticated user lacks permission
```

---

# 29. Running the Project with Docker

From PowerShell:

```powershell
cd C:\credit-card-payment-system
docker compose up -d --build
docker compose ps
```

Run migrations:

```powershell
docker compose exec django python manage.py migrate
```

Create an admin account if required:

```powershell
docker compose exec django python manage.py createsuperuser
```

Check Django:

```powershell
docker compose exec django python manage.py check
```

Open the configured frontend URL, typically:

```text
http://localhost:5173
```

---

# 30. Useful Docker Commands

```powershell
# Validate configuration
docker compose config

# List services
docker compose ps

# Django logs
docker compose logs --tail=100 django

# FastAPI logs
docker compose logs --tail=100 fastapi

# Frontend logs
docker compose logs --tail=100 frontend

# MySQL logs
docker compose logs --tail=100 mysql

# Create migrations when models change
docker compose exec django python manage.py makemigrations

# Apply migrations
docker compose exec django python manage.py migrate

# Run checks
docker compose exec django python manage.py check

# Run tests
docker compose exec django python manage.py test

# Stop containers
docker compose down
```

**Warning:** `docker compose down -v` removes Compose-managed volumes and can delete the local database data. Use it only when you intentionally want to reset the database.

---

# 31. Application URLs

| Application | URL |
|---|---|
| React Frontend | `http://localhost:5173` |
| Django Backend | `http://localhost:8000` |
| Django Admin | `http://localhost:8000/admin/` |
| Django Swagger | `http://localhost:8000/api/docs/` |
| Django Schema | `http://localhost:8000/api/schema/` |
| FastAPI | `http://localhost:8001` |
| FastAPI Swagger | `http://localhost:8001/docs` |
| FastAPI ReDoc | `http://localhost:8001/redoc` |
| Dashboard API | `http://localhost:8001/dashboard/summary` |
| Fraud Alerts API, if configured | `http://localhost:8000/api/payments/fraud/alerts/` |

These URLs require the corresponding services, ports, and routes to be configured.

---

# 32. Environment Variables

Example placeholders for `.env.example`:

```env
DB_NAME=credit_card_db
DB_USER=credit_app
DB_PASSWORD=replace_with_local_password
DB_HOST=mysql
DB_PORT=3306

JWT_SECRET_KEY=replace_with_a_long_random_secret
JWT_ALGORITHM=HS256
```

Configure email settings only if the notification service reads them.

```env
EMAIL_HOST=
EMAIL_PORT=587
EMAIL_HOST_USER=
EMAIL_HOST_PASSWORD=
EMAIL_USE_TLS=True
DEFAULT_FROM_EMAIL=
```

Use real local credentials only in `.env`, and ensure that file is excluded from Git.

---

# 33. Database Dump

Create the backup directory:

```powershell
New-Item -ItemType Directory -Force .\database
```

Example database export using the configured MySQL application credentials:

```powershell
docker exec credit_card_mysql mysqldump --no-tablespaces -u credit_app -p credit_card_db > .\database\credit_card_db.sql
```

Enter the database password when prompted.

The resulting file is:

```text
database/credit_card_db.sql
```

Check that the dump exists:

```powershell
Get-Item .\database\credit_card_db.sql
```

The SQL dump is separate from the live MySQL Docker volume. Do not put real customer data or secrets in the submission dump.

---

# 34. Git and GitHub

Check repository status:

```powershell
git status
```

Verify that `.env` is ignored:

```powershell
git check-ignore .env
```

Stage changes:

```powershell
git add .
git status
```

Commit:

```powershell
git commit -m "Update credit card dashboard and fraud alerts"
```

Push the current branch:

```powershell
git push origin HEAD
```

Do not push credentials, active tokens, email passwords, or sensitive user data.

If a secret was previously committed, simply ignoring the file does not remove it from Git history. Rotate the secret and clean the repository history if necessary.

---

# 35. `.gitignore`

Recommended configuration:

```gitignore
# Environment variables
.env
.env.*
!.env.example

# Python
__pycache__/
*.py[cod]
*.pyo
venv/
.venv/
env/

# Django
*.sqlite3
staticfiles/
media/

# Node
node_modules/
dist/

# IDE
.vscode/
.idea/

# Operating system
.DS_Store
Thumbs.db

# Testing
.pytest_cache/
.coverage
htmlcov/

# Logs
*.log

# Temporary files
response.json
openapi.json
transactions.csv
transactions (1).csv
```

Keep the required database dump and Postman collection only after confirming they contain no secrets or sensitive production data.

---

# 36. Security Checklist

```text
[ ] Passwords are hashed
[ ] JWT is required for protected APIs
[ ] Invalid JWT returns 401
[ ] CVV is never stored
[ ] Full card number is never stored
[ ] Only masked card number is stored
[ ] Only last four digits are stored
[ ] Users can access only their own cards
[ ] Users can access only their own transactions
[ ] Dashboard data is user-specific
[ ] Admin APIs reject normal users
[ ] Amount validation is implemented
[ ] Card validation is implemented
[ ] Expiry validation is implemented
[ ] ORM is used safely
[ ] Secrets are not committed
[ ] Fraud alerts are permission-protected
[ ] Email delivery is verified if enabled
```

---

# 37. Dashboard Checklist

```text
[ ] GET /dashboard/summary is implemented
[ ] JWT authentication is implemented
[ ] Total transactions are calculated correctly
[ ] Total successful spending is calculated correctly
[ ] Current-month spending is calculated correctly
[ ] Available credit is calculated correctly
[ ] Last five transactions are returned
[ ] Queries are scoped to the authenticated user
[ ] React statistic cards are implemented
[ ] Recent transaction table is implemented
[ ] Loading skeleton is implemented
[ ] JWT error handling is implemented
[ ] Postman request is tested
[ ] Dashboard screenshot is captured
```

---

# 38. Final Submission Checklist

## Source Code

```text
[ ] React frontend
[ ] Django backend
[ ] FastAPI backend
[ ] Frontend Dockerfile
[ ] Django Dockerfile
[ ] FastAPI Dockerfile
[ ] docker-compose.yml
```

## Database

```text
[ ] MySQL database
[ ] Database schema and migrations
[ ] Database dump
```

## Authentication

```text
[ ] Registration
[ ] Login
[ ] JWT
[ ] Logout
[ ] Protected APIs
```

## Cards

```text
[ ] Add card
[ ] View cards
[ ] Delete card
[ ] Masked card number
[ ] Last four digits
[ ] Credit limit
[ ] No CVV storage
```

## Payments

```text
[ ] PENDING
[ ] SUCCESS
[ ] FAILED
[ ] FastAPI integration
```

## Transactions

```text
[ ] Transaction history
[ ] Status filter
[ ] Amount filter
[ ] Date filter
[ ] CSV export
[ ] Daily summary
```

## Dashboard

```text
[ ] Total spent
[ ] Available credit
[ ] Total transactions
[ ] Current-month spending
[ ] Last five transactions
[ ] Loading skeleton
[ ] JWT error handling
[ ] Postman test
[ ] UI screenshot
```

## Admin and Fraud Alerts

```text
[ ] Django Admin
[ ] User management
[ ] Card management
[ ] Transaction management
[ ] Payment summary
[ ] Fraud detection
[ ] Fraud alerts in the React admin dashboard
[ ] Email notification delivery verified, if enabled
```

## Documentation and Testing

```text
[ ] Django Swagger
[ ] Django OpenAPI schema
[ ] FastAPI Swagger
[ ] FastAPI ReDoc
[ ] Postman collection
[ ] Authentication tests
[ ] Card tests
[ ] Payment tests
[ ] Transaction tests
[ ] Dashboard tests
[ ] Admin tests
[ ] Test coverage report
```

## Final Files

```text
[ ] GitHub repository link
[ ] README.md
[ ] Database dump
[ ] Postman collection
[ ] UI screenshots
[ ] Admin credentials shared securely
```

---

# 39. Module Status

Use this as a status checklist and mark a module completed only after verifying it in the current project.

```text
Module 1  - Django Authentication
Module 2  - Card Management
Module 3  - FastAPI Payment Processing
Module 4  - Transaction Management
Module 5  - Admin Management
Module 6  - React Frontend
Module 7  - MySQL Database
Module 8  - Security
Module 9  - API Documentation
Module 10 - Docker and Deployment
Module 11 - Testing
Module 12 - Git and Documentation
Dashboard - Credit Usage Dashboard
Fraud     - Fraud Detection and Admin Alerts
Email     - Fraud Email Notifications, if configured
```

---

# 40. Conclusion

The Credit Card Payment System demonstrates a full-stack architecture using:

```text
React
   +
Tailwind CSS
   +
Django REST Framework
   +
FastAPI
   +
MySQL
   +
Docker Compose
```

The intended functionality includes secure authentication, card management, simulated payment processing, transaction history, credit-usage dashboards, administration, fraud alerts, API documentation, and testing.

The dashboard summarizes the authenticated user's credit usage, including spending, available credit, transaction counts, and recent transactions. The admin dashboard can display transaction analytics and suspicious transactions when the corresponding APIs and UI components are enabled.

No real payment gateway is used. The system is an educational simulation and should not be treated as production-ready payment infrastructure.
