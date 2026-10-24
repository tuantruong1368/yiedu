"Create a local .env with random credentials, never overwrite existing configuration."

import base64
import secrets
from pathlib import Path

path = Path(__file__).resolve().parents[1] / ".env"
if path.exists():
    existing = path.read_text()
    if not any(
        line.strip().startswith("CONNECTIONS_ENCRYPTION_KEY=")
        and line.split("=", 1)[1].strip().strip("\"'")
        for line in existing.splitlines()
    ):
        encryption = base64.urlsafe_b64encode(secrets.token_bytes(32)).decode()
        with path.open("a") as stream:
            stream.write("\nCONNECTIONS_ENCRYPTION_KEY=" + encryption + "\n")
        path.chmod(0o600)
        print("Added missing connection encryption key; existing credentials preserved.")
    else:
        print(".env already exists; kept unchanged.")
else:
    password = secrets.token_urlsafe(24)
    key = secrets.token_urlsafe(48)
    path.write_text(
        f"POSTGRES_DB=yiedu\nPOSTGRES_USER=yiedu\nPOSTGRES_PASSWORD={password}\n"
        f"DATABASE_URL=postgresql+psycopg://yiedu:{password}@localhost:5432/yiedu\n"
        f"ADMIN_API_KEY={key}\nCONNECTIONS_ENCRYPTION_KEY={base64.urlsafe_b64encode(secrets.token_bytes(32)).decode()}\nINSTANCE_MODE=saas\nROOT_DOMAIN=localhost\n"
        "PUBLIC_BASE_URL=http://localhost:3000\nCOOKIE_SECURE=false\n"
        "ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000\n"
    )
    path.chmod(0o600)
    print("Created .env with local credentials. No secrets printed.")
