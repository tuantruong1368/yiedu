"""Create a local .env with random credentials, never overwrite existing configuration."""

import secrets
from pathlib import Path

path = Path(__file__).resolve().parents[1] / ".env"
if path.exists():
    print(".env already exists; kept unchanged.")
else:
    password = secrets.token_urlsafe(24)
    key = secrets.token_urlsafe(48)
    path.write_text(
        f"POSTGRES_DB=yiedu\nPOSTGRES_USER=yiedu\nPOSTGRES_PASSWORD={password}\n"
        f"DATABASE_URL=postgresql+psycopg://yiedu:{password}@localhost:5432/yiedu\n"
        f"ADMIN_API_KEY={key}\nINSTANCE_MODE=saas\nROOT_DOMAIN=localhost\n"
        "PUBLIC_BASE_URL=http://localhost:3000\nCOOKIE_SECURE=false\n"
        "ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000\n"
    )
    path.chmod(0o600)
    print("Created .env with local credentials. No secrets printed.")
