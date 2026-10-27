import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

class Command(BaseCommand):
    help = "Create a consistent backup of the current local SQLite database."
    def handle(self, *args, **options):
        database = settings.DATABASES["default"]
        if database["ENGINE"] != "django.db.backends.sqlite3":
            raise CommandError("Use pg_dump for PostgreSQL backups.")
        folder = settings.BASE_DIR / "backups"
        folder.mkdir(exist_ok=True)
        destination = folder / ("invoice-desk-" + datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S%fZ") + ".sqlite3")
        source = Path(database["NAME"])
        if not source.is_file():
            raise CommandError("Database does not exist. Run migrations first.")
        with sqlite3.connect(source.as_uri() + "?mode=ro", uri=True) as original:
            with sqlite3.connect(destination) as backup:
                original.backup(backup)
        self.stdout.write(self.style.SUCCESS(f"Backup created: {destination}"))
