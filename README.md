# Credit Card Payment System

A full-stack **Credit Card Payment System** built using **React, Django, FastAPI, MySQL, and Docker**.

This project simulates credit card payments without connecting to a real payment gateway. It provides secure authentication, card management, payment processing, transaction history, administrative management, API documentation, and Docker-based development.

---

## 1. Project Overview

The system is divided into three main application layers:

- **React + Tailwind CSS** — Frontend user interface
- **Django + Django REST Framework** — Authentication, card management, transactions, and admin APIs
- **FastAPI** — Payment processing service
- **MySQL** — Shared database
- **Docker Compose** — Containerized development environment

### Payment Flow

```text
React Frontend
      |
      | JWT Authentication
      v
Django Backend
      |
      | Payment Request
      v
FastAPI Payment Service
      |
      | Create PENDING Payment
      | Simulate Payment
      v
SUCCESS / FAILED
      |
      v
Django Transaction
      |
      v
React Frontend
```

---

# 2. Main Features

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

### Security

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

CVV is accepted only during the request and is **never stored in the database**.

---

# 3. Payment Processing

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

This is only a simulation for the assignment. No real payment gateway is connected.

---

# 4. Transaction Management

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

/api/payments/history/?status=SUCCESS

/api/payments/history/?status=FAILED

/api/payments/history/?min_amount=100&max_amount=1000

/api/payments/history/?start_date=2026-10-01&end_date=2026-10-01
```

---

# 5. Admin Features

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

# 6. Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React |
| Styling | Tailwind CSS |
| Frontend Build Tool | Vite |
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

# 7. Project Structure

```text
credit-card-payment-system/
│
├── frontend/
│   ├── src/
│   │   ├── components/
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
│   ├── static/
│   │   └── transactions/
│   │       └── daily_payment_summary.css
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
│   │   └── schemas.py
│   │
│   ├── requirements.txt
│   └── Dockerfile
│
├── database/
│   └── database dump files
│
├── docker-compose.yml
├── .env
├── .gitignore
└── README.md
```

---

# 8. Database Design

The project uses MySQL.

Main tables:

```text
accounts_user
cards_card
transactions_transaction
payments
```

Additional admin activity can be maintained through Django admin/logging.

---

## Users Table

Django custom user model is used.

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

Passwords are stored using Django's password hashing system.

---

## Cards Table

```text
id
user_id
card_holder_name
masked_card_number
last_four
expiry_month
expiry_year
created_at
```

The actual card number and CVV are not stored.

---

## Transactions Table

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

## Payments Table

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

# 9. Module Implementation

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

### Main endpoints

```text
POST /api/accounts/register/
POST /api/accounts/login/
POST /api/accounts/token/refresh/
GET  /api/accounts/me/
POST /api/accounts/logout/
```

---

# 10. Module 2 — Card Management

Implemented features:

- Add card
- View cards
- Delete card
- Mask card number
- Store last four digits
- CVV validation
- Expiry validation
- User-specific access

Example stored value:

```text
**** **** **** 1111
```

---

# 11. Module 3 — FastAPI Payment Processing

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

Example successful response:

```json
{
    "id": 1,
    "user_id": 1,
    "card_id": 1,
    "amount": 500,
    "status": "SUCCESS",
    "created_at": "2026-10-01T10:30:00"
}
```

Failed payment example:

```json
{
    "id": 2,
    "user_id": 1,
    "card_id": 1,
    "amount": 501,
    "status": "FAILED",
    "created_at": "2026-10-01T10:35:00"
}
```

---

# 12. Module 4 — Transaction Management

Users can retrieve transaction history.

Endpoint:

```text
GET /api/payments/history/
```

### Status filter

```text
GET /api/payments/history/?status=SUCCESS
```

### Amount filter

```text
GET /api/payments/history/?min_amount=100&max_amount=1000
```

### Date filter

```text
GET /api/payments/history/?start_date=2026-10-01&end_date=2026-10-01
```

### Combined filter

```text
GET /api/payments/history/?status=SUCCESS&min_amount=100&max_amount=1000
```

---

# 13. CSV Export

Admin users can export transaction data.

Endpoint:

```text
GET /api/payments/transactions/admin/export/
```

The CSV contains:

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

The exported card information contains only the last four digits.

---

# 14. Daily Payment Summary

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

# 15. Module 5 — Django Admin

Django Admin is available at:

```text
http://localhost:8000/admin/
```

Admin can manage:

- Users
- Cards
- Transactions
- Payment records
- Application data

Create an admin account using:

```bash
python manage.py createsuperuser
```

When running inside Docker:

```bash
docker compose exec django python manage.py createsuperuser
```

---

# 16. Module 6 — React Frontend

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

### User flow

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

# 17. Admin Dashboard

The admin dashboard provides:

- Admin access verification
- Transaction CSV export
- Daily payment summary
- Navigation to user dashboard
- Logout

Non-admin users are redirected away from the admin dashboard.

---

# 18. Module 7 — MySQL Database

MySQL 8 is used as the primary database.

Database name:

```text
credit_card_db
```

Application database user:

```text
credit_app
```

Docker MySQL service:

```text
mysql
```

Inside Docker, Django and FastAPI connect using:

```text
DB_HOST=mysql
```

They should not use:

```text
DB_HOST=localhost
```

when communicating with the MySQL Docker container.

---

# 19. Module 8 — Security

The project implements the following security practices.

### 1. Password Hashing

Passwords are not stored as plain text.

Django's password hashing mechanism is used.

---

### 2. JWT Authentication

Protected APIs require:

```text
Authorization: Bearer <access_token>
```

---

### 3. No CVV Storage

CVV is accepted during card creation but is not stored.

---

### 4. No Actual Card Number Storage

Only:

```text
masked_card_number
last_four
```

are stored.

---

### 5. Input Validation

Validation is applied to:

- Username
- Email
- Password
- Card number
- CVV
- Expiry month
- Expiry year
- Amount

---

### 6. SQL Injection Protection

The application uses:

```text
Django ORM
SQLAlchemy ORM
```

instead of constructing SQL queries directly from user input.

ORM queries are parameterized by the framework.

---

### 7. User Data Isolation

Users can access only their own:

```text
Cards
Transactions
```

---

### 8. Admin Authorization

Admin APIs use:

```text
IsAdminUser
```

to restrict administrative operations.

---

### 9. Environment Variables

Sensitive configuration should be stored in environment variables.

Example:

```env
DB_NAME=credit_card_db
DB_USER=credit_app
DB_PASSWORD=credit_password
DB_HOST=mysql
DB_PORT=3306
```

Do not commit real secrets to GitHub.

---

# 20. Module 9 — API Documentation

## Django Swagger

Open:

```text
http://localhost:8000/api/docs/
```

Django OpenAPI schema:

```text
http://localhost:8000/api/schema/
```

Django API documentation is generated using:

```text
drf-spectacular
```

---

## FastAPI Swagger

Open:

```text
http://localhost:8001/docs
```

FastAPI provides interactive Swagger UI automatically.

---

## FastAPI ReDoc

Open:

```text
http://localhost:8001/redoc
```

---

# 21. Postman Testing

A Postman collection is included for API testing.

Recommended collection structure:

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
├── Admin
│   ├── Get Admin JWT
│   ├── CSV Export
│   └── Daily Payment Summary
│
└── Documentation
    ├── Django Swagger
    ├── Django Schema
    ├── FastAPI Swagger
    └── FastAPI ReDoc
```

---

# 22. Running the Project Without Docker

## Step 1 — Start MySQL

Make sure MySQL is running.

Create the database:

```sql
CREATE DATABASE credit_card_db;
```

Create the application user if required:

```sql
CREATE USER 'credit_app'@'localhost' IDENTIFIED BY 'credit_password';
```

Grant permissions:

```sql
GRANT ALL PRIVILEGES ON credit_card_db.* TO 'credit_app'@'localhost';
```

---

# 23. Run Django

Open PowerShell:

```bash
cd C:\credit-card-payment-system\django_backend
```

Create virtual environment:

```bash
python -m venv venv
```

Activate:

```powershell
.\venv\Scripts\Activate.ps1
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Run migrations:

```bash
python manage.py makemigrations
python manage.py migrate
```

Create admin:

```bash
python manage.py createsuperuser
```

Start Django:

```bash
python manage.py runserver
```

Django runs at:

```text
http://localhost:8000
```

---

# 24. Run FastAPI

Open another terminal:

```bash
cd C:\credit-card-payment-system\fastapi_backend
```

Create virtual environment:

```bash
python -m venv venv
```

Activate:

```powershell
.\venv\Scripts\Activate.ps1
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Start FastAPI:

```bash
uvicorn app.main:app --reload --port 8001
```

FastAPI runs at:

```text
http://localhost:8001
```

Swagger:

```text
http://localhost:8001/docs
```

---

# 25. Run React

Open another terminal:

```bash
cd C:\credit-card-payment-system\frontend
```

Install dependencies:

```bash
npm install
```

Start the frontend:

```bash
npm run dev
```

React runs at:

```text
http://localhost:5173
```

---

# 26. Running With Docker

The project contains:

```text
docker-compose.yml
```

Services:

```text
mysql
django
fastapi
frontend
```

Start all containers:

```bash
docker compose up --build
```

Run in background:

```bash
docker compose up -d --build
```

---

# 27. Verify Docker Containers

Run:

```bash
docker compose ps
```

Expected services:

```text
credit_card_mysql
credit_card_django
credit_card_fastapi
credit_card_frontend
```

All services should show a running status.

---

# 28. Docker URLs

### Frontend

```text
http://localhost:5173
```

### Django

```text
http://localhost:8000
```

### Django Admin

```text
http://localhost:8000/admin/
```

### Django Swagger

```text
http://localhost:8000/api/docs/
```

### FastAPI

```text
http://localhost:8001
```

### FastAPI Swagger

```text
http://localhost:8001/docs
```

### FastAPI ReDoc

```text
http://localhost:8001/redoc
```

---

# 29. Docker Useful Commands

Check containers:

```bash
docker compose ps
```

View Django logs:

```bash
docker compose logs django
```

View FastAPI logs:

```bash
docker compose logs fastapi
```

View MySQL logs:

```bash
docker compose logs mysql
```

Open Django shell:

```bash
docker compose exec django python manage.py shell
```

Run Django migrations:

```bash
docker compose exec django python manage.py makemigrations
docker compose exec django python manage.py migrate
```

Create superuser:

```bash
docker compose exec django python manage.py createsuperuser
```

Run Django checks:

```bash
docker compose exec django python manage.py check
```

Stop containers:

```bash
docker compose down
```

Stop containers and remove database volume:

```bash
docker compose down -v
```

> `docker compose down -v` deletes the MySQL Docker volume and therefore removes the development database data.

---

# 30. Environment Variables

Create a `.env` file for local configuration.

Example:

```env
DB_NAME=credit_card_db
DB_USER=credit_app
DB_PASSWORD=credit_password
DB_HOST=mysql
DB_PORT=3306
```

For production, use strong passwords and proper secret management.

Never commit sensitive production credentials to GitHub.

---

# 31. API Examples

## Register

```http
POST /api/accounts/register/
```

Request:

```json
{
    "username": "ramkumar",
    "email": "ram@example.com",
    "password": "StrongPassword123",
    "first_name": "Ram",
    "last_name": "Kumar"
}
```

---

## Login

```http
POST /api/accounts/login/
```

Request:

```json
{
    "username": "ramkumar",
    "password": "StrongPassword123"
}
```

Response:

```json
{
    "refresh": "JWT_REFRESH_TOKEN",
    "access": "JWT_ACCESS_TOKEN"
}
```

---

## Current User

```http
GET /api/accounts/me/
```

Header:

```text
Authorization: Bearer <access_token>
```

---

## Add Card

```http
POST /api/cards/
```

Header:

```text
Authorization: Bearer <access_token>
```

Request:

```json
{
    "card_holder_name": "Ram Kumar",
    "card_number": "4111111111111111",
    "cvv": "123",
    "expiry_month": 12,
    "expiry_year": 2030
}
```

Response should contain masked card information, not the original card number or CVV.

Example:

```json
{
    "id": 1,
    "card_holder_name": "Ram Kumar",
    "masked_card_number": "**** **** **** 1111",
    "last_four": "1111",
    "expiry_month": 12,
    "expiry_year": 2030
}
```

---

## Make Payment

```http
POST /api/payments/payments/
```

Header:

```text
Authorization: Bearer <access_token>
```

Request:

```json
{
    "card_id": 1,
    "amount": 500
}
```

Example result:

```json
{
    "status": "SUCCESS"
}
```

---

# 32. Testing Strategy

The project should include tests for:

## Authentication

- Registration
- Login
- Invalid login
- Protected endpoint
- Logout
- Token validation

## Card Management

- Add card
- View cards
- Delete card
- Invalid card number
- Invalid CVV
- Invalid expiry
- User isolation
- Verify CVV is not stored
- Verify actual card number is not stored

## Payment

- Payment creation
- PENDING state
- SUCCESS payment
- FAILED payment
- Invalid amount
- Invalid card
- Unauthorized payment

## Transactions

- Transaction history
- SUCCESS filter
- FAILED filter
- Amount filter
- Date filter
- Combined filters
- User-specific transaction access

## Admin

- Admin authorization
- CSV export
- Daily payment summary
- Non-admin access rejection

---

# 33. Security Test Checklist

Before final submission, verify:

```text
[ ] Password is not stored as plain text
[ ] JWT is required for protected APIs
[ ] Invalid JWT returns 401
[ ] CVV is never stored
[ ] Actual card number is never stored
[ ] Only masked card number is stored
[ ] Only last four digits are stored
[ ] Users cannot access another user's cards
[ ] Users cannot access another user's transactions
[ ] Admin APIs reject normal users
[ ] Amount must be greater than zero
[ ] Invalid card numbers are rejected
[ ] Invalid expiry values are rejected
[ ] ORM is used instead of unsafe raw SQL
[ ] Secrets are not committed to Git
```

---

# 34. Git Workflow

Recommended commits:

```text
git add .
git commit -m "Initial project setup"

git commit -m "Add Django authentication"

git commit -m "Add card management"

git commit -m "Add FastAPI payment service"

git commit -m "Add transaction management"

git commit -m "Add admin dashboard"

git commit -m "Add React frontend"

git commit -m "Add API documentation"

git commit -m "Add Docker configuration"

git commit -m "Add tests and project documentation"
```

Push:

```bash
git push origin main
```

---

# 35. Important Git Security

Before pushing the project:

```bash
git status
```

Check that sensitive files are not being committed.

Recommended `.gitignore` entries:

```gitignore
# Python
__pycache__/
*.py[cod]
venv/
.venv/

# Django
*.sqlite3
staticfiles/

# Environment
.env
.env.*

# Node
node_modules/
dist/

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db

# Testing
.pytest_cache/
.coverage
htmlcov/
```

Do not commit:

```text
.env
passwords
database credentials
JWT secrets
production API keys
payment secrets
```

---

# 36. Database Dump

For final submission, export the MySQL database.

Example:

```bash
mysqldump -u credit_app -p credit_card_db > database/credit_card_db.sql
```

The database dump should be included in the final submission if required by the assignment.

---

# 37. Final Submission Checklist

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
[ ] Protected routes
```

## Cards

```text
[ ] Add card
[ ] View cards
[ ] Delete card
[ ] Masked card number
[ ] Last four digits
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

## Admin

```text
[ ] Django admin
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

# 38. Application URLs Summary

| Application | URL |
|---|---|
| React | `http://localhost:5173` |
| Django | `http://localhost:8000` |
| Django Admin | `http://localhost:8000/admin/` |
| Django Swagger | `http://localhost:8000/api/docs/` |
| Django Schema | `http://localhost:8000/api/schema/` |
| FastAPI | `http://localhost:8001` |
| FastAPI Swagger | `http://localhost:8001/docs` |
| FastAPI ReDoc | `http://localhost:8001/redoc` |

---

# 39. Project Status

Current implementation status:

```text
Module 1  - Django Authentication       - Completed
Module 2  - Card Management              - Completed
Module 3  - FastAPI Payment Processing   - Completed
Module 4  - Transaction Management       - Completed
Module 5  - Django Admin                 - Completed
Module 6  - React UI                     - Completed
Module 7  - MySQL Database               - Completed
Module 8  - Security                     - Completed
Module 9  - API Documentation            - Completed
Module 10 - Docker & Deployment           - In Progress / Final Verification
Module 11 - Testing                       - Pending / Final Verification
Module 12 - Git & Documentation           - In Progress
```

---

# 40. Conclusion

The Credit Card Payment System demonstrates a complete full-stack architecture using:

```text
React
   +
Django REST Framework
   +
FastAPI
   +
MySQL
   +
Docker
```

The application provides secure user authentication, card management, simulated payment processing, transaction management, administrative features, API documentation, and containerized development.

The system is designed so that sensitive card information such as the actual card number and CVV is not stored in the database.

No real payment gateway is used. Payment processing is simulated through the FastAPI service for development and assignment purposes.