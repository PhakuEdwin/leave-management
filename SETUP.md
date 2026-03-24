# Staff Leave Management System - Setup & Instructions

## Overview
A standalone staff leave management web application for Dr P Malatji's practice.
- **Port:** 3003
- **Tech:** Node.js, Express, tRPC, React, Tailwind CSS, SQLite (better-sqlite3)
- **Database:** Self-contained SQLite file (`leave_management.db`) - no MySQL needed

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Build the project
npm run build

# 3. Start the server
node dist/server/index.js
```

The app will be available at `http://localhost:3003`

## Default Admin Login
- **Username:** `admin`
- **Password:** `admin123`
- This account is auto-created on first run. Change the password after first login via Staff management.

## Project Structure

```
leave_management/
├── server/
│   ├── index.ts          # Express server entry point (port 3003)
│   ├── db.ts             # SQLite database setup & schema
│   ├── auth.ts           # JWT authentication (login, verify, hash)
│   ├── trpc.ts           # tRPC context, router, middleware
│   └── router.ts         # All API routes (auth, leave, user)
├── client/
│   ├── index.html        # HTML entry point
│   └── src/
│       ├── main.tsx       # React entry + providers
│       ├── App.tsx        # Router + navbar + route guards
│       ├── auth.tsx       # Auth context (JWT in localStorage)
│       ├── trpc.ts        # tRPC client setup
│       ├── index.css      # Tailwind CSS imports
│       └── pages/
│           ├── Login.tsx          # Login page
│           ├── Dashboard.tsx      # Welcome + stats + recent requests
│           ├── RequestLeave.tsx   # Leave request form
│           ├── Calendar.tsx       # Monthly calendar with approved leaves
│           ├── AdminRequests.tsx  # Admin: approve/decline requests
│           └── ManageStaff.tsx    # Admin: add/edit/delete staff
├── package.json
├── tsconfig.json          # Client TypeScript config
├── tsconfig.server.json   # Server TypeScript config (CommonJS output)
├── vite.config.ts         # Vite config for client build
├── tailwind.config.js
├── postcss.config.js
└── SETUP.md               # This file
```

## Features

### Staff
- Login with username/password
- Submit leave requests (Normal Leave, Study/Exam Leave, Family Responsibility)
- View leave balance (annual, per year)
- View own request history
- Calendar view of all approved leaves

### Admin
- All staff features
- Approve or decline leave requests (with optional decline reason)
- Manage staff (add/edit/delete, set leave balance)
- See pending request count badge in navbar
- Leave balance auto-deducts on approval (Normal Leave only)

### Leave Types
- **Normal Leave** - deducts from annual balance (default 21 days)
- **Study / Exam Leave** - does not deduct from balance
- **Family Responsibility** - does not deduct from balance

### Business Day Calculation
- Weekends (Saturday/Sunday) are excluded from day count
- Only business days are counted between start and end dates

## Configuration

### JWT Secret
In `server/auth.ts` - change `JWT_SECRET` for production:
```typescript
const JWT_SECRET = 'leave-mgmt-secret-key-2026';
```

### Port
In `server/index.ts` - change `PORT` constant:
```typescript
const PORT = 3003;
```

### Database Location
The SQLite database file is created at the project root as `leave_management.db`.
Path is set in `server/db.ts`.

## Development

```bash
# Run in dev mode with hot reload
npm run dev
```

## Timezone
All dates are stored as plain date strings (YYYY-MM-DD) in SQLite. Display uses `Africa/Johannesburg` timezone via `toLocaleDateString()` options.

---

## TODO: Pending Features

### 1. Email Notification on Leave Request
When a staff member submits a leave request, send an email notification to the admin.

**Requirements:**
- Configure SMTP settings (host, port, user, password) - details to be provided
- Configure admin email address - to be provided
- Send email when a new leave request is submitted
- Email should include: staff name, leave type, dates, number of days, reason
- Consider using `nodemailer` package

**Implementation notes:**
- Add SMTP config to a `.env` file or a settings table in the database
- Create `server/email.ts` with a `sendLeaveNotification()` function
- Call it from the `leave.create` mutation in `server/router.ts`
- Optionally also notify staff when their request is approved/declined

### 2. Future Enhancements (optional)
- Password change by staff (currently admin-only)
- Leave request attachments (e.g., medical certificate)
- Annual leave balance reset (auto-reset each year)
- Export leave reports (CSV/PDF)
- Public holidays integration (exclude from business day calculation)
