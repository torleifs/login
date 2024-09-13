from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import ValidationError


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env", ".env.local"), env_file_encoding="utf-8"
    )

    database_url: str
    host: str
    port: str


try:
    settings = Settings()
except ValidationError as e:
    print(e)
