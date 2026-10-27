# Invoice Desk

Next.js dashboard and authenticated Django REST API, integrated with
[Yousha-dev/django-saas-backend-template](https://github.com/Yousha-dev/django-saas-backend-template).
See [backend/UPSTREAM.md](backend/UPSTREAM.md) for the exact revision and integration boundaries.

## What works

- Email/password registration, sign-in and sign-out; private invoices per account.
- Session authentication with CSRF protection for the browser.
- JWT access/rotating refresh tokens for API clients; password changes revoke existing JWTs.
- Profile updates, password changes, password reset links.
- Invoice create/read/edit/delete, paid/unpaid status and payment timestamps.
- Server-side search, status filters, pagination, summary totals, CSV export and reminder drafts.
- Invoice activity history and Django admin.
- Template user, subscription, plan, feature, payment, notification and event models.
- Plan/subscription read APIs; staff manage subscriptions and plans in Django admin.
- Swagger/OpenAPI docs, health endpoint, PostgreSQL configuration, Redis/Celery and Docker setup.

External payment, SMS and push providers are retained from the template but are **not active**.
They need credentials, billing decisions and provider-specific integration/testing before use.
Reminders are copied for manual review; nothing is charged or sent automatically.
Password reset email prints in the backend terminal locally; configure SMTP for real email.

## Run locally (Windows PowerShell)

Python 3.13 and Node.js 22 are supported by this setup.

Backend, in one terminal:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe manage.py migrate
.\.venv\Scripts\python.exe manage.py runserver 127.0.0.1:8000
```

Frontend, in another terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open http://127.0.0.1:3000 and select **Create an account**.
There are no default passwords or pre-created administrator accounts.

- API documentation: http://127.0.0.1:8000/swagger/
- Admin: http://127.0.0.1:8000/admin/
- Health: http://127.0.0.1:8000/api/health/

To create an administrator, run in backend:

```powershell
.\.venv\Scripts\python.exe manage.py createsuperuser
```

For custom settings, copy backend/.env.example to backend/.env, generate a secret,
and edit the relevant values. Development works without a .env.
The frontend forwards /api/ to Django. Set BACKEND_URL before starting/building
Next.js to change the backend address.

## Storage and backup

Local data lives in backend/invoice-desk.sqlite3. The original prototype database
backend/db.sqlite3 was preserved; it contained zero invoices during this integration.
Do not reuse that older database with the new custom user model.

Back up SQLite while the app is running using SQLite's backup API:

```powershell
cd backend
.\.venv\Scripts\python.exe manage.py backup_database
```

Backups go to backend/backups with unique timestamped names and include accounts
and invoices. Keep backup copies private and copy them to durable storage.
For PostgreSQL use pg_dump and test restoration regularly.

## API

Browser clients first GET /api/auth/csrf/, then pass csrfToken as X-CSRFToken
on mutations. Registration/login return the rotated csrfToken. Cookies are HttpOnly.
API clients can POST email/password to /api/auth/token/ and use Authorization: Bearer.

| Endpoint | Methods / purpose |
| --- | --- |
| /api/auth/register/, /login/, /logout/ | POST account/session actions |
| /api/auth/me/ | GET, PATCH safe profile fields |
| /api/auth/change-password/ | POST current_password, new_password |
| /api/auth/request-password-reset/ | POST email |
| /api/auth/reset-password/ | POST uid, token, new_password |
| /api/auth/token/, /api/auth/token/refresh/ | POST JWT credentials/refresh |
| /api/invoices/ | GET paginated list; POST invoice |
| /api/invoices/{id}/ | GET, PATCH, PUT, DELETE owned invoice |
| /api/invoices/summary/ | GET account totals (INR) |
| /api/invoices/{id}/reminder/ | GET reminder text |
| /api/invoices/export/ | GET CSV |
| /api/activity/ | GET paginated activity history |
| /api/plans/, /api/subscriptions/ | GET plans / own subscriptions |
| /api/health/ | GET database health |

List responses have count, next, previous, results. Invoice list/export accept
status=all|pending|overdue|paid and search=. Pages contain up to 50 records.
Invoice amounts are positive decimal strings with at most two decimal places.
Invoice numbers are unique within an account. Due-today invoices are pending.
The backend uses Asia/Kolkata for date boundaries and INR for invoice currency.
The template's subscription plan prices retain their upstream USD meaning.

JWT logout blacklists the submitted refresh token; access tokens expire after
15 minutes. Browser logout immediately invalidates the current session.
Password changes/reset invalidate other sessions and existing JWTs.
Invoice mutations are audited. The admin invoice screens are read-only so edits
go through the audited API.

## Tests

```powershell
cd backend
.\.venv\Scripts\python.exe manage.py test accounts --settings=configuration.settings.test
.\.venv\Scripts\python.exe manage.py makemigrations --check --dry-run
```

In frontend, run npm run build. Set NEXT_BUILD_DIR=.next-build to build independently
of a running development server.

## PostgreSQL and Redis locally

Set DB_PASSWORD in your shell or a root .env, then run docker compose up -d.
Set DB_ENGINE=postgresql, DB_NAME, DB_USER, DB_PASSWORD, DB_HOST and DB_PORT
in backend/.env. Set REDIS_URL=redis://127.0.0.1:6379/0.
Run migrations against the new database. Switching databases does not copy SQLite data.

Without Redis, local caching and Celery tasks run in-process.
With Redis, start a worker from backend:

```powershell
.\.venv\Scripts\celery.exe -A configuration worker --pool=solo --loglevel=info
```

The optional invoices.tasks.clean_expired_authentication job clears expired sessions
and tokens. Schedule it through Django admin's periodic task screen if desired.
No notification or billing job is scheduled by default.

## Deployment

1. Prepare backend/.env with DJANGO_ENV=production, a random SECRET_KEY (50+ chars),
   DB_ENGINE=postgresql, database credentials, REDIS_URL, your actual ALLOWED_HOSTS,
   FRONTEND_URL, CSRF_TRUSTED_ORIGINS and CORS_ALLOWED_ORIGINS.
2. Configure SMTP for password resets. Keep secrets outside source control.
3. Use docker compose --env-file backend/.env -f docker-compose.prod.yml build.
4. Start db and redis, then run a one-off web container with python manage.py migrate
   and python manage.py collectstatic --noinput. Create an administrator explicitly.
5. Start web, worker and beat. Place a trusted HTTPS reverse proxy in front of the
   frontend and backend. Route /api/, /admin/, /swagger/ and /static/ appropriately.
   Serve collected static files from the static_files volume.
6. Set TRUST_PROXY=true only if that proxy overwrites X-Forwarded-Proto.
   Configure durable PostgreSQL backups and test the deployment before public use.

Production settings require PostgreSQL/Redis and enforce HTTPS/secure cookies.
The Compose files provide the backend stack; domain, TLS and frontend hosting are
deployment-specific and are not provisioned automatically.
