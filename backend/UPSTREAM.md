# Template provenance and integration

Source: https://github.com/Yousha-dev/django-saas-backend-template
Revision: 593323cd7778db2ef3529b6bf2e4d032ab43fcbf

The upstream myapp package (models, migrations, services, APIs, providers, and tasks)
is included in backend/myapp. The Celery application is reused. UPSTREAM_README.md
and requirements-upstream.txt preserve upstream reference material.

Invoice Desk uses the template's custom email user, subscription/plan, feature,
payment, notification, event, and audit model migrations. Its admin registrations
are loaded. configuration/settings follows the template's environment split but
uses application-specific settings and safe local defaults.

accounts/ replaces the public authentication interface with restricted serializers,
password validation, session CSRF protection, rotating JWT refresh tokens and
revocation after password changes. invoices/ provides account-scoped invoice CRUD,
search, pagination, summary, CSV export, reminder drafts and an activity history.

Upstream API URL modules are deliberately NOT mounted: their defaults include public
payment endpoints and a registration serializer accepting role and password fields.
The upstream API code is retained for reference, not treated as production-audited.
Do not mount it directly. Only configuration/urls.py defines the supported live API.

External provider adapters (Stripe, PayPal, Apple/Google purchases, SendGrid, Twilio,
Firebase) are retained but not activated or exposed. They require provider credentials,
additional dependencies, product-specific billing rules and integration tests before use.
Installing requirements-upstream.txt does not enable them automatically.

No automatic email reminders, subscription charges or payment verification are enabled.
Password reset email uses Django email settings; local mail goes to the console.
Plan/subscription administration is available to staff in Django admin; authenticated
users can read available plans and their own subscriptions.

The upstream repository did not contain a top-level license file at the imported
revision. No upstream license is invented or implied by this attribution.

Original prototype data remains in backend/db.sqlite3. The new custom-user database
is backend/invoice-desk.sqlite3. The original database contained zero invoices during
integration. Do not point the new backend at an existing prototype database without
an explicit data migration; changing AUTH_USER_MODEL alters migration dependencies.
