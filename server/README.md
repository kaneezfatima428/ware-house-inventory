# Clinic Appointment Management System — Backend API

A complete, production-grade RESTful API for a **Clinic Appointment Management System** built with **Node.js, Express.js, MongoDB (Mongoose), JSON Web Tokens (JWT), and bcryptjs**.

All backend source code is cleanly organized inside the `src/` directory.

---

## 📁 Directory Structure

```
server/
├── .env                              # Environment configuration (Port, MongoURI, JWT secrets)
├── .env.example                      # Template environment variables
├── package.json                      # Project dependencies & scripts
├── server.js                         # Server entry point (loads env, connects DB, starts listener)
├── README.md                         # Detailed documentation and API testing guide
├── src/
│   ├── app.js                        # Express app, middlewares, and API route mounts
│   ├── db/
│   │   └── db.js                     # MongoDB connection with DNS fix for Atlas on Windows
│   ├── models/
│   │   ├── User.js                   # User schema (patient, doctor, admin)
│   │   ├── Appointment.js            # Appointment schema with refs & indexes
│   │   └── DoctorAvailability.js     # Optional bonus availability schema
│   ├── middlewares/
│   │   ├── auth.middleware.js        # protect & authorize(...roles) middleware
│   │   ├── errorHandler.js           # 404 & centralized error handler (CastError, 11000, JWT)
│   │   └── upload.middleware.js      # Multer memory storage
│   ├── controllers/
│   │   ├── auth.controller.js        # register, login, getMe
│   │   ├── doctor.controller.js      # getDoctors (with search/filter), getDoctorById
│   │   ├── appointment.controller.js # book, getMyAppointments, getDoctorAppointments, updateStatus, cancel
│   │   └── admin.controller.js       # getAllUsers, addDoctor, deleteUser, updateStatus, getAppointments, getStats
│   ├── routes/
│   │   ├── auth.routes.js            # /api/auth
│   │   ├── doctor.routes.js          # /api/doctors
│   │   ├── appointment.routes.js     # /api/appointments
│   │   └── admin.routes.js           # /api/admin
│   └── scripts/
│       └── seedAdmin.js              # Auto-seeds default admin if none exists
└── test/
    └── unit.test.js                  # Automated test suite (15 unit & business rule tests)
```

---

## 🚀 Key Features & Business Rules Implemented

1. **Role-Based Access Control (RBAC)**:
   - 3 Distinct Roles: `admin`, `doctor`, and `patient`.
   - Middleware: `protect` (JWT Bearer token verification + active account check) and `authorize(...roles)`.

2. **Automated Seeding**:
   - Default Administrator account is automatically created on first server startup if no admin exists:
     - **Email**: `admin@clinic.com`
     - **Password**: `admin123`

3. **Strict Business Logic Compliance**:
   - **Rule 1 & 2**: Only logged-in patients can book appointments.
   - **Rule 3 & 4**: Doctors can approve or reject appointments assigned strictly to them; doctors cannot modify appointments belonging to other doctors.
   - **Rule 5**: Patients can view only their own appointments.
   - **Rule 6**: Patients can cancel only appointments that are in `"pending"` status.
   - **Rule 7**: Admins can view all registered users and all appointments.
   - **Rule 8**: Patients cannot book two appointments with the same doctor at the same date and time slot.
   - **Bonus Check**: Prevents double booking if a doctor already has an approved appointment at that date & time slot.
   - **Admin Protections**: Admins cannot delete or deactivate their own account.

---

## 🛠️ Setup & Running

### 1. Install Dependencies
```bash
cd server
npm install
```

### 2. Configure Environment (`.env`)
```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.bfhjuob.mongodb.net/clinic_management?retryWrites=true&w=majority
JWT_SECRET=super_secret_clinic_appointment_jwt_token_2026_key
JWT_EXPIRE=7d
ADMIN_NAME=System Administrator
ADMIN_EMAIL=admin@clinic.com
ADMIN_PASSWORD=admin123
```

### 3. Start the Server
```bash
# Production mode
npm start

# Development mode (with live reload)
npm run dev
```

### 4. Run Automated Tests
```bash
node --test test/unit.test.js
```

---

## 📡 API Reference

### 🔐 1. Authentication Routes (`/api/auth`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Register patient (or doctor with specialization & experience) |
| `POST` | `/api/auth/login` | Public | Authenticate user, checks `isActive`, returns JWT & profile |
| `GET` | `/api/auth/me` | Authenticated | Retrieve current user profile |

---

### 🩺 2. Doctor Routes (`/api/doctors`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/doctors` | Authenticated | Get all active doctors. Query params: `?search=`, `?name=`, `?specialization=` |
| `GET` | `/api/doctors/:id` | Authenticated | Get doctor details by ID |

---

### 📅 3. Appointment Routes (`/api/appointments`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/appointments` | Patient | Book an appointment (validates duplicate date/time slot) |
| `GET` | `/api/appointments/my` | Patient | View patient's own appointments (populated doctor) |
| `GET` | `/api/appointments/doctor` | Doctor | View doctor's assigned appointments (populated patient) |
| `PATCH` | `/api/appointments/:id/status` | Doctor | Doctor approves/rejects their assigned appointment (`{ "status": "approved" \| "rejected" }`) |
| `PATCH` | `/api/appointments/:id/cancel` | Patient | Patient cancels appointment (only if status is `"pending"`) |

---

### 🛡️ 4. Admin Routes (`/api/admin`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/users` | Admin | View all users (`?role=doctor` or `?role=patient`) |
| `POST` | `/api/admin/doctors` | Admin | Create a doctor account directly |
| `DELETE` | `/api/admin/users/:id` | Admin | Delete a user & clean up related appointments |
| `PATCH` | `/api/admin/users/:id/status` | Admin | Activate or deactivate user (`{ "isActive": false }`) |
| `GET` | `/api/admin/appointments` | Admin | View all appointments (populated patient & doctor) |
| `GET` | `/api/admin/stats` | Admin | View aggregate metrics (patients, doctors, appointments by status) |
