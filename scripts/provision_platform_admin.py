"""Grant/revoke an existing verified owner's platform role from the server console.

No default password. Signup never grants this role, including for the configured email.
"""

import argparse

from sqlalchemy import delete, select
from sqlalchemy.orm import Session
from yiedu.business_models import PlatformEvent
from yiedu.config import get_settings
from yiedu.db import get_engine
from yiedu.models import AuthSession, User


def provision(db, email, revoke=False):
    user = db.scalar(select(User).where(User.email == email.strip().lower()).with_for_update())
    if not user:
        raise ValueError("Register this email first, then run this command on your server")
    user.platform_admin = not revoke
    db.execute(delete(AuthSession).where(AuthSession.user_id == user.id))
    db.add(
        PlatformEvent(
            actor_id=user.id,
            action="platform.role.revoked" if revoke else "platform.role.granted",
            detail={"source": "server-console"},
        )
    )
    db.commit()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--email", default=get_settings().platform_admin_email)
    parser.add_argument("--revoke", action="store_true")
    args = parser.parse_args()
    if not args.email:
        parser.error("Pass --email for the account whose ownership you verified")
    with Session(get_engine()) as db:
        try:
            provision(db, args.email, args.revoke)
        except ValueError as exc:
            parser.error(str(exc))
    print("Role updated. Existing sessions revoked; log in again at /platform.")
