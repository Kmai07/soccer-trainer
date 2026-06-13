from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    APP_NAME: str
    DATABASE_URL: str
    REDIS_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    AWS_BUCKET_NAME: str
    LLM_BASE_URL: str = "https://generativelanguage.googleapis.com/v1beta/openai"
    LLM_MODEL: str = "gemini-2.5-flash"
    OPENAI_API_KEY: str = ""
    model_config = SettingsConfigDict(env_file=".env")

settings = Settings()