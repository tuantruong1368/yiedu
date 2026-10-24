from alembic import context
from yiedu import business_models  # noqa: F401
from yiedu.db import get_engine
from yiedu.models import Base


def run():
    if context.is_offline_mode():
        from yiedu.config import get_settings

        context.configure(
            url=get_settings().database_url, target_metadata=Base.metadata, literal_binds=True
        )
        with context.begin_transaction():
            context.run_migrations()
    else:
        with get_engine().connect() as connection:
            context.configure(connection=connection, target_metadata=Base.metadata)
            with context.begin_transaction():
                context.run_migrations()


run()
