import os

os.environ.setdefault("DATABASE_URL", "postgresql+psycopg://unused:unused@localhost/unused")
os.environ.setdefault("ADMIN_API_KEY", "test-key-" + "x" * 40)
