from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    #    DATABASE_URL: str
    REDIS_URL: str
    # Default for local development
    CORS_ORIGINS: list[str] = ["http://localhost:3000"]

    class Config:
        env_file = ".env.Develop"


settings = Settings()
