# Credit Card Payment System

A full-stack **Credit Card Payment System** built using **React, Tailwind CSS, Django, FastAPI, MySQL, and Docker**.

This project simulates credit card payments without connecting to a real payment gateway. It provides secure authentication, card management, payment processing, transaction history, user dashboard, administrative management, API documentation, API testing, and Docker-based development.

---

# 1. Project Overview

The system is divided into multiple application layers:

- **React + Tailwind CSS** — Frontend user interface
- **Django + Django REST Framework** — Authentication, card management, transaction management, and admin functionality
- **FastAPI** — Payment processing and dashboard summary service
- **MySQL** — Shared relational database
- **Docker Compose** — Containerized development environment

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
             |                           |
             v                           v
      Authentication              Card Management
             |                           |
             +-------------+-------------+
                           |
                           v
                    Transactions
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

The payment flow is:

```text
React Frontend
      |
      | JWT + Payment Request
      v
Django Backend
      |
      | Payment Request
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
      v
MySQL
      |
      v
React Frontend
```

---

# 3. Dashboard Flow

The dashboard retrieves the authenticated user's credit card usage information.

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
      +---- SUM Transaction Amount
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

- User registration
- User login
- JWT access token
- JWT refresh token
- Protected APIs
- Logout
- Password hashing
- Current user API
- Admin authentication

---

## Card Management

- Add credit card
- View saved cards
- Delete card
- User-specific cards
- Card number validation
- Expiry validation
- CVV validation
- Masked card number
- Last four digits storage
- Credit limit

### Card Security

Actual card numbers are **not stored**.

Example:

```text
Actual card number:
4111111111111111

Stored masked card:
**** **** **** 1111

Stored last four:
1111
```

CVV is accepted during the request but is **never stored in the database**.

---

# 5. Dashboard

The dashboard provides a quick overview of the user's credit card usage.

The dashboard displays:

1. Total spent
2. Available credit
3. Total transactions
4. Current month spending
5. Last 5 transactions

---

## Dashboard API

Endpoint:

```text
GET /dashboard/summary
```

Full URL:

```text
http://localhost:8001/dashboard/summary
```

The API requires JWT authentication.

Header:

```text
Authorization: Bearer <access_token>
```

---

## Dashboard Response

Example:

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

---

# 6. Dashboard Statistics

## Total Transactions

The API counts the authenticated user's successful transactions.

Conceptually:

```sql
SELECT COUNT(id)
FROM transactions_transaction
WHERE user_id = ?
AND status = 'SUCCESS';
```

---

## Total Amount Spent

The API calculates the total successful spending using:

```sql
SELECT SUM(amount)
FROM transactions_transaction
WHERE user_id = ?
AND status = 'SUCCESS';
```

---

## Current Month Spending

The API calculates the successful spending for the current month.

Conceptually:

```text
Current Month Spending
=
SUM(successful transactions
    created during current month)
```

---

## Available Credit

The available credit is calculated using:

```text
Available Credit
=
Credit Limit - Total Amount Spent
```

Example:

```text
Credit Limit = ₹50,000
Total Spent  = ₹2,500

Available Credit
= ₹50,000 - ₹2,500
= ₹47,500
```

---

## Last 5 Transactions

The dashboard retrieves only the latest five transactions.

Conceptually:

```sql
SELECT
    amount,
    masked_card_number,
    created_at,
    status
FROM transactions_transaction
JOIN cards_card
ON transactions_transaction.card_id = cards_card.id
WHERE transactions_transaction.user_id = ?
ORDER BY created_at DESC
LIMIT 5;
```

This avoids loading the user's complete transaction history unnecessarily.

---

# 7. Dashboard UI

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

The dashboard also contains:

```text
Recent Transactions

Amount       Status       Date          Masked Card
------------------------------------------------------
₹500.00      SUCCESS      07/10/2026    **** **** 1111
₹250.00      SUCCESS      06/10/2026    **** **** 1111
₹100.00      FAILED       05/10/2026    **** **** 1111
```

---

# 8. Dashboard Loading State

While the API is being called, the dashboard displays a loading skeleton.

The purpose of the loading skeleton is to:

- Inform the user that data is loading
- Prevent a blank screen
- Improve user experience
- Provide visual feedback

Example:

```text
Dashboard

[ Loading... ] [ Loading... ]
[ Loading... ] [ Loading... ]

Recent Transactions
[ Loading row ]
[ Loading row ]
[ Loading row ]
```

---

# 9. Dashboard Error Handling

If the JWT is missing or expired, the API returns:

```text
401 Unauthorized
```

The React application displays an error message such as:

```text
Your session has expired. Please login again.
```

Other API errors display:

```text
Unable to load dashboard data. Please try again.
```

---

# 10. Dashboard Security

The dashboard is protected using JWT.

Request:

```http
GET /dashboard/summary
Authorization: Bearer <access_token>
```

Without a valid JWT:

```text
401 Unauthorized
```

This prevents users from accessing another user's dashboard data.

The FastAPI service obtains the user ID from the validated JWT and uses that ID when querying MySQL.

---

# 11. Payment Processing

Payments are processed through the FastAPI service.

The payment lifecycle is:

```text
PENDING
   |
   +----> SUCCESS
   |
   +----> FAILED
```

For the current simulation:

```text
Even amount  -> SUCCESS
Odd amount   -> FAILED
```

Example:

```text
₹500 -> SUCCESS
₹501 -> FAILED
```

This is only a simulation for the assignment.

No real payment gateway is connected.

---

# 12. Transaction Management

Users can view their own transactions.

Supported filters:

- Status
- Minimum amount
- Maximum amount
- Start date
- End date
- Combined filters

Examples:

```text
/api/payments/history/
```

```text
/api/payments/history/?status=SUCCESS
```

```text
/api/payments/history/?status=FAILED
```

```text
/api/payments/history/?min_amount=100&max_amount=1000
```

```text
/api/payments/history/?start_date=2026-10-01&end_date=2026-10-01
```

---

# 13. Admin Features

Admin users can:

- View users
- View cards
- View transactions
- Export transactions as CSV
- View daily payment summary
- View payment status
- View successful payments
- View failed payments
- View pending payments
- View total payment amount

Admin APIs are protected using admin permissions.

---

# 14. CSV Export

Admin users can export transaction data.

Endpoint:

```text
GET /api/payments/transactions/admin/export/
```

The CSV contains information such as:

```text
Transaction ID
Username
Email
Card
Amount
Status
Payment ID
Created At
```

Only masked card information is exported.

---

# 15. Daily Payment Summary

The system provides a daily payment summary.

Summary information includes:

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

---

# 16. Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React |
| Styling | Tailwind CSS |
| Build Tool | Vite |
| Backend 1 | Django |
| API Framework | Django REST Framework |
| Authentication | JWT |
| Backend 2 | FastAPI |
| ORM | Django ORM + SQLAlchemy |
| Database | MySQL 8 |
| API Documentation | DRF Spectacular + FastAPI Swagger |
| API Testing | Postman |
| Containerization | Docker |
| Orchestration | Docker Compose |
| Language | Python + JavaScript |

---

# 17. Project Structure

```text
credit-card-payment-system/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Cards.jsx
│   │   │   ├── Payment.jsx
│   │   │   ├── Transactions.jsx
│   │   │   └── AdminDashboard.jsx
│   │   │
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   │
│   ├── package.json
│   ├── vite.config.js
│   ├── Dockerfile
│   └── ...
│
├── django_backend/
│   │
│   ├── config/
│   │   ├── settings.py
│   │   ├── urls.py
│   │   ├── wsgi.py
│   │   └── asgi.py
│   │
│   ├── accounts/
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── urls.py
│   │   └── admin.py
│   │
│   ├── cards/
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── urls.py
│   │   └── admin.py
│   │
│   ├── transactions/
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── urls.py
│   │   ├── admin.py
│   │   └── templates/
│   │       └── transactions/
│   │           └── daily_payment_summary.html
│   │
│   ├── manage.py
│   ├── requirements.txt
│   └── Dockerfile
│
├── fastapi_backend/
│   │
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── database.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   ├── auth.py
│   │   │
│   │   └── routes/
│   │       ├── dashboard.py
│   │       └── ...
│   │
│   ├── requirements.txt
│   └── Dockerfile
│
├── database/
│   └── credit_card_db.sql
│
├── docker-compose.yml
├── .env
├── .gitignore
└── README.md
```

---

# 18. Database Design

The project uses MySQL 8.

Database name:

```text
credit_card_db
```

Main tables:

```text
accounts_user
cards_card
transactions_transaction
payments
```

Additional Django tables are created automatically for authentication, permissions, sessions, and admin functionality.

---

# 19. Users Table

The project uses a custom Django user model.

Important fields:

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

Passwords are stored using Django's password hashing mechanism.

---

# 20. Cards Table

The card table contains:

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

The actual card number and CVV are not stored.

---

# 21. Transactions Table

The transaction table contains:

```text
id
user_id
card_id
amount
status
payment_id
created_at
```

Possible statuses:

```text
PENDING
SUCCESS
FAILED
```

---

# 22. Payments Table

FastAPI maintains the payment processing record.

```text
id
user_id
card_id
amount
status
created_at
```

---

# 23. Module Implementation

## Module 1 — Django Authentication

Implemented features:

- Registration
- Login
- JWT authentication
- JWT refresh
- Logout
- Password hashing
- Protected API
- Current user API
- Admin authentication

Main endpoints:

```text
POST /api/accounts/register/
POST /api/accounts/login/
POST /api/accounts/token/refresh/
GET  /api/accounts/me/
POST /api/accounts/logout/
```

---

# 24. Module 2 — Card Management

Implemented features:

- Add card
- View cards
- Delete card
- Mask card number
- Store last four digits
- Credit limit
- CVV validation
- Expiry validation
- User-specific access

---

# 25. Module 3 — FastAPI Payment Processing

FastAPI provides the payment service.

Main endpoint:

```text
POST /payments/
```

Example request:

```json
{
    "user_id": 1,
    "card_id": 1,
    "amount": 500
}
```

---

# 26. Module 4 — Transaction Management

Transaction history endpoint:

```text
GET /api/payments/history/
```

Supported filters:

```text
status
min_amount
max_amount
start_date
end_date
```

---

# 27. Module 5 — Admin Management

Django Admin:

```text
http://localhost:8000/admin/
```

Admin can manage:

```text
Users
Cards
Transactions
Payment records
```

Admin can also access:

```text
Daily Payment Summary
CSV Export
```

---

# 28. Module 6 — React Frontend

The React application contains:

```text
Login
Register
Dashboard
Cards
Payment
Transaction History
Admin Dashboard
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

# 29. Module 6A — Dashboard

The dashboard was implemented using React and Tailwind CSS.

Features:

```text
Total Spent
Available Credit
Total Transactions
This Month Spending
Last 5 Transactions
Loading Skeleton
JWT Error Handling
```

API:

```text
GET /dashboard/summary
```

Authentication:

```text
Authorization: Bearer <JWT>
```

---

# 30. Module 7 — MySQL Database

MySQL 8 is used as the primary database.

Database:

```text
credit_card_db
```

Application user:

```text
credit_app
```

Docker MySQL service:

```text
mysql
```

Inside Docker, Django and FastAPI connect to MySQL using:

```text
DB_HOST=mysql
```

They should not use:

```text
DB_HOST=localhost
```

for Docker-to-Docker communication.

---

# 31. Module 8 — Security

The project implements:

### Password Hashing

Passwords are never stored as plain text.

### JWT Authentication

Protected APIs require:

```text
Authorization: Bearer <access_token>
```

### No CVV Storage

CVV is never stored.

### No Actual Card Number Storage

Only:

```text
masked_card_number
last_four
```

are stored.

### Input Validation

Validation is applied to:

```text
Username
Email
Password
Card Number
CVV
Expiry
Amount
```

### ORM Security

The project uses:

```text
Django ORM
SQLAlchemy
```

to avoid unsafe SQL construction.

### User Data Isolation

Users can access only their own:

```text
Cards
Transactions
Dashboard
```

### Admin Authorization

Administrative functionality requires admin permissions.

---

# 32. Module 9 — API Documentation

## Django Swagger

```text
http://localhost:8000/api/docs/
```

## Django OpenAPI Schema

```text
http://localhost:8000/api/schema/
```

Django documentation is generated using:

```text
drf-spectacular
```

## FastAPI Swagger

```text
http://localhost:8001/docs
```

## FastAPI ReDoc

```text
http://localhost:8001/redoc
```

---

# 33. Module 10 — Docker

The project uses Docker Compose to run:

```text
React
Django
FastAPI
MySQL
```

Architecture:

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

```bash
docker compose up -d --build
```

Check containers:

```bash
docker compose ps
```

Stop:

```bash
docker compose down
```

---

# 34. Module 11 — Testing

Testing is performed for:

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
Invalid Card
Invalid CVV
Invalid Expiry
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
```

## Dashboard

```text
Dashboard Summary
JWT Authentication
Invalid JWT
Total Transactions
Total Amount
Current Month Spending
Available Credit
Last 5 Transactions
```

## Admin

```text
Admin Authorization
CSV Export
Daily Summary
```

---

# 35. Postman Testing

The project includes a Postman collection.

Recommended collection:

```text
credit-card-payment-system
│
├── Authentication
│   ├── Register
│   ├── Login
│   ├── Me
│   └── Logout
│
├── Cards
│   ├── Add Card
│   ├── My Cards
│   └── Delete Card
│
├── Payments
│   ├── Make Payment - SUCCESS
│   └── Make Payment - FAILED
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
    ├── Admin Login
    ├── CSV Export
    └── Daily Payment Summary
```

Dashboard Postman request:

```http
GET http://localhost:8001/dashboard/summary
```

Header:

```text
Authorization: Bearer {{access_token}}
```

Expected:

```text
200 OK
```

Without a valid token:

```text
401 Unauthorized
```

---

# 36. Running the Project With Docker

From the project root:

```bash
cd C:\credit-card-payment-system
```

Start all services:

```bash
docker compose up -d --build
```

Check:

```bash
docker compose ps
```

Expected:

```text
credit_card_mysql
credit_card_django
credit_card_fastapi
credit_card_frontend
```

---

# 37. Useful Docker Commands

Check containers:

```bash
docker compose ps
```

Django logs:

```bash
docker compose logs django
```

FastAPI logs:

```bash
docker compose logs fastapi
```

MySQL logs:

```bash
docker compose logs mysql
```

Frontend logs:

```bash
docker compose logs frontend
```

Run Django migrations:

```bash
docker compose exec django python manage.py makemigrations
docker compose exec django python manage.py migrate
```

Create admin:

```bash
docker compose exec django python manage.py createsuperuser
```

Django check:

```bash
docker compose exec django python manage.py check
```

Stop:

```bash
docker compose down
```

---

# 38. Application URLs

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

---

# 39. Environment Variables

Example:

```env
DB_NAME=credit_card_db
DB_USER=credit_app
DB_PASSWORD=credit_password
DB_HOST=mysql
DB_PORT=3306

JWT_SECRET_KEY=your-secret-key
JWT_ALGORITHM=HS256
```

Sensitive values should not be committed to GitHub.

---

# 40. Database Dump

The MySQL database can be exported using:

```bash
docker exec credit_card_mysql mysqldump --no-tablespaces -u credit_app -pcredit_password credit_card_db > database/credit_card_db.sql
```

The dump is stored as:

```text
database/credit_card_db.sql
```

The SQL file is a backup/submission copy of the database and is separate from the live MySQL Docker volume.

---

# 41. Git and GitHub

Check status:

```bash
git status
```

Add changes:

```bash
git add .
```

Commit:

```bash
git commit -m "Add credit card dashboard"
```

Push:

```bash
git push origin main
```

Before pushing, verify that `.env` and other secrets are ignored.

---

# 42. `.gitignore`

Recommended:

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
"transactions (1).csv"
```

---

# 43. Security Checklist

Before final submission:

```text
[ ] Password is not stored as plain text
[ ] JWT is required for protected APIs
[ ] Invalid JWT returns 401
[ ] CVV is never stored
[ ] Actual card number is never stored
[ ] Only masked card number is stored
[ ] Only last four digits are stored
[ ] Users can access only their own cards
[ ] Users can access only their own transactions
[ ] Dashboard is user-specific
[ ] Admin APIs reject normal users
[ ] Amount validation is implemented
[ ] Card validation is implemented
[ ] Expiry validation is implemented
[ ] ORM is used
[ ] Secrets are not committed
```

---

# 44. Dashboard Checklist

```text
[ ] GET /dashboard/summary created
[ ] JWT authentication implemented
[ ] Total transactions calculated
[ ] Total amount spent calculated
[ ] Current month spending calculated
[ ] Available credit calculated
[ ] Last 5 transactions returned
[ ] transactions table queried
[ ] cards table queried
[ ] SUM(amount) used
[ ] LIMIT 5 used
[ ] React dashboard created
[ ] Statistic cards created
[ ] Transaction table created
[ ] Loading skeleton created
[ ] JWT error handling created
[ ] Postman request created
[ ] UI screenshot captured
```

---

# 45. Final Submission Checklist

## Source Code

```text
[ ] React frontend
[ ] Django backend
[ ] FastAPI backend
[ ] Dockerfile - frontend
[ ] Dockerfile - Django
[ ] Dockerfile - FastAPI
[ ] docker-compose.yml
```

## Database

```text
[ ] MySQL database
[ ] Database schema
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
[ ] Current month spending
[ ] Last 5 transactions
[ ] Loading skeleton
[ ] JWT error handling
[ ] Postman test
[ ] Dashboard screenshot
```

## Admin

```text
[ ] Django Admin
[ ] User management
[ ] Card management
[ ] Transaction management
[ ] Payment summary
```

## Documentation

```text
[ ] Django Swagger
[ ] Django OpenAPI schema
[ ] FastAPI Swagger
[ ] FastAPI ReDoc
[ ] Postman collection
[ ] README.md
```

## Testing

```text
[ ] Authentication tests
[ ] Card tests
[ ] Payment tests
[ ] Transaction tests
[ ] Dashboard tests
[ ] Admin tests
[ ] Minimum 50% coverage
```

## Final Files

```text
[ ] GitHub repository
[ ] README.md
[ ] Database dump
[ ] Postman collection
[ ] UI screenshots
[ ] Admin credentials
```

---

# 46. Module Status

```text
Module 1  - Django Authentication       - Completed
Module 2  - Card Management              - Completed
Module 3  - FastAPI Payment Processing   - Completed
Module 4  - Transaction Management       - Completed
Module 5  - Admin Management             - Completed
Module 6  - React Frontend               - Completed
Module 7  - MySQL Database               - Completed
Module 8  - Security                     - Completed
Module 9  - API Documentation            - Completed
Module 10 - Docker & Deployment          - Completed
Module 11 - Testing                      - Completed
Module 12 - Git & Documentation          - Completed
Dashboard - Credit Usage Dashboard       - Completed
```

---

# 47. Conclusion

The Credit Card Payment System demonstrates a complete full-stack architecture using:

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
Docker
```

The application provides:

```text
Secure Authentication
        +
Card Management
        +
Simulated Payment Processing
        +
Transaction Management
        +
Credit Card Usage Dashboard
        +
Admin Management
        +
API Documentation
        +
Postman Testing
        +
Docker Containerization
```

The dashboard provides users with a quick view of their credit card usage, including total spending, available credit, total transactions, current-month spending, and the latest five transactions.

The dashboard API is protected using JWT authentication and retrieves user-specific information from the MySQL `transactions_transaction` and `cards_card` tables.

No real payment gateway is used. Payment processing is simulated through FastAPI for development and assignment purposes.