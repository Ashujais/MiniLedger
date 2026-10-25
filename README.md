# 💰 MiniLedger

> A modern, full-stack application to track money lent to friends with instant phone login, financial summaries, overdue tracking, and receipt photo attachments.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.21-lightgrey.svg)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue.svg)](https://www.postgresql.org/)
[![React Native](https://img.shields.io/badge/React_Native-Expo_58-purple.svg)](https://reactnative.dev/)
[![Jest Tests](https://img.shields.io/badge/Tests-18_Passing-brightgreen.svg)](https://jestjs.io/)

---

## 📋 Table of Contents
- [✨ Key Features](#-key-features)
- [🏗 Architecture & Tech Stack](#-architecture--tech-stack)
- [🚀 Quick Start (Running in 2 Minutes)](#-quick-start-running-in-2-minutes)
- [💾 Database Setup (PostgreSQL)](#-database-setup-postgresql)
- [📱 Mobile App Guide (React Native / Expo)](#-mobile-app-guide-react-native--expo)
- [📡 API Documentation](#-api-documentation)
- [🧪 Running Tests](#-running-tests)
- [🎁 Bonus Features Implemented](#-bonus-features-implemented)
- [📁 Project Structure](#-project-structure)

---

## ✨ Key Features

### 🔐 Phone Number Login with Mock OTP
- Fast, passwordless phone login with 6-digit one-time passwords.
- Mock SMS gateway prints the generated OTP prominently to the server terminal:
  ```
  ════════════════════════════════════════════════════════════
  📱 [MOCK SMS GATEWAY] MiniLedger OTP Verification
  ════════════════════════════════════════════════════════════
    Recipient Phone : +919876543210
    One-Time Pass   : 👉 482915 👈
    Valid For       : 5 minutes
  ════════════════════════════════════════════════════════════
  ```
- Demo convenience master code `123456` is also accepted for instant testing.
- Issues secure JWT tokens for authenticated API sessions.

### 💳 Loan Entry Tracking & Repayment
- Create loans with **Friend Name**, **Amount**, **Due Date**, and optional **Notes**.
- One-tap **"Mark as Repaid"** with instant timestamping and status updates.
- Quick shortcut chips (`+₹500`, `+₹1000`, `In 7 Days`, `In 2 Weeks`).

### 📊 Real-Time Financial Summary Card
- Header card showing live calculated metrics:
  - **Total Lent** (Sum of all money lent)
  - **Total Repaid** (Sum of repaid loans)
  - **Overdue Amount** (Total outstanding money past due date)
  - **Net Active Lent** (`Total Lent - Total Repaid`)
  - Micro indicators (Total count, active loans, overdue count, repaid count)

### ⚠️ Prominent Overdue Highlighting
- Automatic server-side and client-side overdue detection when `due_date < CURRENT_DATE` and `is_repaid = false`.
- Overdue loans are styled with:
  - Alert red left border and soft rose background
  - `⚠️ OVERDUE (X days)` pill badge
  - Red amount text and urgent alert banner

### 📸 Receipt Photo Attachment (Bonus Feature)
- Attach receipt images to any loan entry via camera or photo library.
- Multi-part file upload handled securely via Express & Multer.
- In-app thumbnail preview and full-screen zoomable receipt viewer.

---

## 🏗 Architecture & Tech Stack

```
                     ┌────────────────────────────────────────┐
                     │          React Native App              │
                     │  (iOS, Android, Web via Expo SDK 58)   │
                     └───────────────────┬────────────────────┘
                                         │ JSON / Multipart HTTP
                                         ▼
                     ┌────────────────────────────────────────┐
                     │           Node.js + Express            │
                     │       TypeScript REST Backend          │
                     │  (JWT Auth, Zod Validation, Multer)    │
                     └───────────────────┬────────────────────┘
                                         │ SQL Queries
                                         ▼
                     ┌────────────────────────────────────────┐
                     │         PostgreSQL Database            │
                     │  (Live Postgres via Docker / Native    │
                     │   + In-Memory pg-mem Auto Fallback)    │
                     └────────────────────────────────────────┘
```

- **Backend:** Node.js 20+, TypeScript, Express 4, `pg` (node-postgres), `pg-mem` (in-memory PostgreSQL engine), Zod validation, JWT, Multer.
- **Mobile:** React Native, Expo SDK 58, TypeScript, `expo-image-picker`, `@react-native-async-storage/async-storage`.
- **Database:** PostgreSQL 16 (dockerized or local) with relational schema (Users, OTPs, Loans, foreign keys, indexes, timestamps).

---

## 🚀 Quick Start (Running in 2 Minutes)

### Prerequisites
- [Node.js](https://nodejs.org/) v20+ installed
- [npm](https://www.npmjs.com/) installed
- Optional: [Docker Desktop](https://www.docker.com/) (for live PostgreSQL container)

### Step 1: Clone Repository
```bash
git clone https://github.com/Ashutosh00567/MiniLedger.git
cd MiniLedger
```

### Step 2: Start Backend
```bash
cd backend
npm install
npm run dev
```
The backend API will start on **http://localhost:5000**.

> 💡 **Zero-Friction Database:** If you don't have PostgreSQL running locally, the backend automatically boots an in-memory PostgreSQL instance (`pg-mem`) so you can run and test immediately without installing or configuring anything!

### Step 3: Start Mobile App (React Native)
In a new terminal:
```bash
cd mobile
npm install
npm start
```
From the Expo menu:
- Press **`w`** to open in your web browser (zero setup preview!).
- Press **`a`** to open in Android Emulator.
- Press **`i`** to open in iOS Simulator (macOS only).
- Scan the QR code with **Expo Go** on your physical Android or iPhone.

---

## 💾 Database Setup (PostgreSQL)

You have two simple options for PostgreSQL:

### Option A: Using Docker Compose (Recommended for Production)
Run PostgreSQL in Docker with one command from the project root:
```bash
docker compose up -d postgres
```
This spins up PostgreSQL 16 on `localhost:5432` and mounts `backend/src/db/schema.sql` automatically.

### Option B: Automatic Zero-Config Fallback
If PostgreSQL is not running when the backend starts, MiniLedger detects the missing connection and automatically activates an embedded in-memory PostgreSQL engine (`pg-mem`). All queries, SQL constraints, foreign keys, and indexes run 100% identically!

---

## 📱 Mobile App Guide (React Native / Expo)

### Connecting from a Physical Device
When testing on a physical phone using the **Expo Go** app:
1. Ensure your computer and phone are connected to the same Wi-Fi network.
2. Find your computer's local LAN IP (e.g., `192.168.1.5` on Windows via `ipconfig`).
3. On the MiniLedger Login screen, tap **⚙️ Server Endpoint** at the bottom and enter:
   ```
   http://192.168.1.5:5000
   ```
4. Tap **Update URL**.

---

## 📡 API Documentation

### Base URL: `http://localhost:5000/api`

### 1. Authentication

#### Send Mock OTP
```http
POST /api/auth/send-otp
Content-Type: application/json

{
  "phoneNumber": "+919876543210"
}
```
*Response (200 OK):*
```json
{
  "success": true,
  "message": "OTP sent successfully. Check your server logs for the OTP code.",
  "debugOtp": "624193"
}
```
*(Check server terminal log for mock SMS banner)*

#### Verify OTP & Login
```http
POST /api/auth/verify-otp
Content-Type: application/json

{
  "phoneNumber": "+919876543210",
  "otp": "624193"
}
```
*Response (200 OK):*
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "5282a338-7df5-4e44-ba84-b82039bfa1fa",
      "phone_number": "+919876543210"
    }
  },
  "message": "Logged in successfully"
}
```

---

### 2. Loans API (Requires `Authorization: Bearer <token>`)

#### Get Financial Summary
```http
GET /api/loans/summary
Authorization: Bearer <token>
```
*Response (200 OK):*
```json
{
  "success": true,
  "data": {
    "totalLent": 6500,
    "totalRepaid": 2000,
    "overdueAmount": 1500,
    "pendingAmount": 4500,
    "totalCount": 3,
    "repaidCount": 1,
    "overdueCount": 1,
    "pendingCount": 2
  }
}
```

#### List Loan Entries
```http
GET /api/loans?status=all&search=Rahul
Authorization: Bearer <token>
```
*Query Parameters:*
- `status`: `all` | `overdue` | `pending` | `repaid`
- `search`: Filter by friend name or notes
- `sortBy`: `due_date` | `created_at` | `amount`
- `sortOrder`: `ASC` | `DESC`

*Response (200 OK):*
```json
{
  "success": true,
  "data": [
    {
      "id": "b45fc787-f7d6-4784-8c4f-1ba7dfd84f8c",
      "user_id": "5282a338-7df5-4e44-ba84-b82039bfa1fa",
      "friend_name": "Rahul Sharma",
      "amount": 5000,
      "due_date": "2026-11-15",
      "is_repaid": false,
      "repaid_at": null,
      "notes": "Dinner and movie tickets",
      "receipt_url": "http://localhost:5000/uploads/1729837200-receipt.jpg",
      "is_overdue": false,
      "created_at": "2026-10-25T05:20:00.000Z",
      "updated_at": "2026-10-25T05:20:00.000Z"
    }
  ],
  "count": 1
}
```

#### Add Loan Entry (Supports Multipart / Receipt)
```http
POST /api/loans
Authorization: Bearer <token>
Content-Type: multipart/form-data

friendName: "Rahul Sharma"
amount: 5000
dueDate: "2026-11-15"
notes: "Dinner bill"
receipt: <receipt_image.jpg>
```
*Response (201 Created):*
```json
{
  "success": true,
  "data": { ...loanObject },
  "message": "Loan entry created successfully"
}
```

#### Mark Loan as Repaid
```http
PATCH /api/loans/:id/repay
Authorization: Bearer <token>
```
*Response (200 OK):*
```json
{
  "success": true,
  "data": {
    "id": "b45fc787-f7d6-4784-8c4f-1ba7dfd84f8c",
    "is_repaid": true,
    "repaid_at": "2026-10-25T05:25:00.000Z"
  },
  "message": "Loan to Rahul Sharma marked as repaid"
}
```

---

## 🧪 Running Tests

### Backend Unit & Integration Tests (18 Passing Tests)
Includes authentication flow, OTP validation, loan creation rules, overdue calculations, and financial summary assertions:
```bash
cd backend
npm test
```

### Mobile App Utility Tests
```bash
cd mobile
npm test
```

---

## 🎁 Bonus Features Implemented

1. **Receipt Photo Attachment & Viewer:**
   - Image picker integration for capturing/uploading paper receipts.
   - Served via static endpoint with thumbnail preview on each loan card.
   - Dedicated full-screen image viewer modal.
2. **Schema & Input Validation:**
   - Robust type-safe validation using **Zod** across all request parameters, query filters, and payloads.
   - Instant client-side validation in the mobile app with friendly error alerts.
3. **Comprehensive Automated Test Suites:**
   - 18 Jest test cases testing the end-to-end backend and data processing pipeline.
4. **Flexible Local Database Engine:**
   - Transparent zero-config in-memory PostgreSQL engine (`pg-mem`) alongside standard live PostgreSQL support.
5. **Cross-Platform Compatibility:**
   - Runs seamlessly on Web, Android, and iOS through Expo.

---

## 📁 Project Structure

```
MiniLedger/
├── backend/
│   ├── src/
│   │   ├── config/index.ts          # Environment configuration
│   │   ├── controllers/             # Express controllers (auth, loans)
│   │   ├── db/
│   │   │   ├── index.ts             # PostgreSQL pool & pg-mem fallback
│   │   │   └── schema.sql           # Database schema & indexes
│   │   ├── middleware/              # Auth, Error handling, Multer upload
│   │   ├── routes/                  # API route definitions
│   │   ├── services/                # Business logic (AuthService, LoansService)
│   │   ├── types/index.ts           # Shared TypeScript interfaces
│   │   ├── validators/              # Zod validation schemas
│   │   ├── app.ts                   # Express app setup
│   │   └── server.ts                # Server bootstrap & lifecycle
│   ├── tests/
│   │   ├── auth.test.ts             # Auth & OTP test suite
│   │   └── loans.test.ts            # Loans CRUD & Summary test suite
│   ├── uploads/                     # Uploaded receipt photos storage
│   ├── Dockerfile
│   ├── tsconfig.json
│   └── package.json
├── mobile/
│   ├── src/
│   │   ├── api/client.ts            # Typed HTTP API client
│   │   ├── components/
│   │   │   ├── SummaryCard.tsx      # Top financial metrics card
│   │   │   ├── LoanCard.tsx         # Loan entry card with overdue styles
│   │   │   ├── AddLoanModal.tsx     # Add loan entry form modal
│   │   │   └── ReceiptModal.tsx     # Full-screen receipt preview modal
│   │   ├── context/AuthContext.tsx  # Authentication state & session restore
│   │   ├── screens/
│   │   │   ├── LoginScreen.tsx      # Phone + OTP login screen
│   │   │   └── HomeScreen.tsx       # Loan entries dashboard
│   │   ├── theme/colors.ts          # Fintech color palette
│   │   ├── types/index.ts           # Mobile TypeScript models
│   │   └── utils/date.ts            # Date & currency formatting
│   ├── __tests__/date.test.ts       # Utility test suite
│   ├── App.tsx                      # Root application component
│   ├── app.json                     # Expo app configuration
│   └── package.json
├── docker-compose.yml               # PostgreSQL & Backend container setup
├── .gitignore
├── package.json                     # Monorepo root scripts
└── README.md                        # Documentation
```

---

## 👨‍💻 Author
**Ashutosh Kumar Jaiswal**  
GitHub: [@Ashutosh00567](https://github.com/Ashutosh00567)  
Email: ashutoshhjp00567@gmail.com
