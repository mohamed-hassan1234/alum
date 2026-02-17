# Alumni Management System (MERN + Tailwind)

Production-style Alumni Management System for university administrators.

## Stack
- `MongoDB` (local)
- `Express` + `Node.js`
- `React` (Vite) + `Tailwind CSS`
- `Mongoose`, `JWT`, `React Query`, `Recharts`, `React Hook Form`, `React Select`

## Branding
- Primary: `#1c9d56`
- Secondary: `#31a5d6`
- University logo integrated at:
  - `frontend/public/logo.png`
  - sidebar + login page UI

## Completed Scope

### Backend
- Full REST API with MVC structure under `backend/`
- JWT authentication (`/api/auth/login`, `/api/auth/me`)
- Protected admin routes
- CRUD for:
  - Faculties
  - Departments
  - Classes
  - Batches
  - Jobs
  - Students (with soft/permanent delete + restore)
- Student advanced filtering:
  - faculties, departments, classes, batch years, jobs, gender, employment status, search
- Analytics endpoints:
  - dashboard cards/charts
  - analytics hub datasets
- Reports endpoint:
  - export filtered students as CSV / Excel / PDF
- Settings endpoint:
  - JSON backup export
- Upload pipeline:
  - local file storage (`/uploads/students`)
  - optional Cloudinary
- Seed script with required sample distribution:
  - 50 students
  - faculties/departments/classes/batches/jobs populated

### Frontend
- Full protected admin SPA in `frontend/`
- Auth + session handling
- Responsive admin layout with sidebar/topbar
- Pages completed:
  - Login
  - Dashboard
  - Faculty Management
  - Department Management
  - Class Management
  - Batch Management
  - Job Management
  - Student Management (advanced filters + table/grid + pagination + export + add/edit multi-step form)
  - Student Details/Profile
  - Advanced Analytics Hub (filter-aware charts + PNG/PDF chart export)
  - Reports & Export
  - Settings (profile, password, preferences, backup)
- UI utilities:
  - reusable cards, buttons, modal, table, pagination, badges, skeletons
- Error boundary + toasts + dark mode support

## Project Structure

### Backend
```text
backend/
├── config/
├── controllers/
├── middleware/
├── models/
├── routes/
├── uploads/
├── utils/
└── server.js
```

### Frontend
```text
frontend/
├── public/
└── src/
    ├── components/
    │   ├── charts/
    │   ├── common/
    │   ├── filters/
    │   ├── layouts/
    │   └── students/
    ├── context/
    ├── hooks/
    ├── pages/
    ├── services/
    └── utils/
```

## Environment

### Backend `.env` (already created)
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/alumni_management
JWT_SECRET=dev_secret_change_me
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173
UPLOAD_PROVIDER=local
```

Optional Cloudinary variables are in `backend/.env.example`.

## Run Locally

### 1) Backend
```bash
cd backend
npm install
npm run seed
npm run dev
```

### 2) Frontend
```bash
cd frontend
npm install
npm run dev
```

## Default Admin Login (Seeded)
- Email: `admin@alumni.local`
- Password: `Admin@123`

## Verification Already Run
- `frontend`: `npm run build` passed
- `backend`: JS syntax check passed
- `backend`: `npm run seed` passed
- `backend`: `/api/health` returned `{"status":"ok"}`

