from celery import shared_task
from django.core.management import call_command

@shared_task
def clean_expired_authentication():
    """Optional maintenance job; never sends reminders or processes payments."""
    call_command("clearsessions")
    call_command("flushexpiredtokens")
    return {"status": "ok"}
