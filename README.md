# Sanjeevni Tech — Smart Hospital Management System

A full-stack hospital management application built to organize hospital operations through role-based access.

## Technology Stack

- Frontend: React, Vite, Tailwind CSS, Lucide React, Recharts
- Backend: Python, FastAPI, SQLAlchemy
- Database: PostgreSQL
- Authentication: JWT, bcrypt, role-based access control (RBAC)
- AI/ML: Python and scikit-learn
- Reports: ReportLab

## Main Modules

- User, patient, doctor, nurse, and staff management
- Appointments, admissions, discharge, wards, beds, and ICU
- Medical records, vitals, prescriptions, and laboratory workflows
- Pharmacy, inventory, procurement, billing, and payments
- Notifications, analytics, reports, and audit logs

## Project Structure

- `frontend/` — React and Vite application
- `backend/` — FastAPI application, models, routers, services, and tests
- `backend/alembic/` — database migration configuration and revisions
- `database/` — database-related project resources
- `docs/` — project documentation

## Local Development

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

### Backend

From the project root, activate the backend virtual environment:

```powershell
.\backend\.venv\Scripts\Activate.ps1
```

Install backend dependencies:

```powershell
pip install -r backend\requirements.txt
```

Configure the required environment variables and PostgreSQL connection using the backend configuration before starting the API. Keep actual secrets in local environment files; never commit them.

Run the frontend and backend using their configured development commands. Apply database migrations according to the project's Alembic configuration.

## Security Notes

- Do not commit `.env` files, database credentials, private keys, or generated credential CSV files.
- Use fictional data for demonstrations and testing.
- Configure strong secrets and secure database credentials for each environment.
- This project is intended for development and demonstration. Review security, privacy, and clinical requirements before production use.

## Testing

The backend includes a pytest test suite. Run tests from the project root after activating the backend environment:

```powershell
python -m pytest backend/app/tests -q
```

The frontend production build can be checked from `frontend/`:

```powershell
npm run build
```
