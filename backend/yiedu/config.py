from functools import lru_cache

from pydantic import SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")
    database_url: str
    admin_api_key: SecretStr


@lru_cache
def get_settings() -> Settings:
    settings = Settings()
    value = settings.admin_api_key.get_secret_value()
    if len(value) < 32 or value.startswith("replace-with"):
        raise ValueError("Set ADMIN_API_KEY to a random value of at least 32 characters")
    return settings
