import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[2] / ".env")
environment = os.getenv("DJANGO_ENV", "development")
if environment == "production":
    from .production import *
elif environment == "test":
    from .test import *
elif environment == "development":
    from .development import *
else:
    raise ValueError("DJANGO_ENV must be development, production, or test")
