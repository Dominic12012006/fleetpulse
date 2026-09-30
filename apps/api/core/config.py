"""
FleetPulse Backend API — Application Configuration
"""


from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "FleetPulse Connected Vehicle Intelligence"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "fleetpulse-super-secure-production-jwt-key-2026-xyz987"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    ALGORITHM: str = "HS256"

    # Multi-Tenant & Admin Defaults
    DEFAULT_TENANT_ID: str = "e2b10a24-1f33-4f24-9df2-5c8e44123456"

    # Polyglot Storage Connection Strings
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/fleetpulse"
    CLICKHOUSE_HOST: str = "localhost"
    CLICKHOUSE_PORT: int = 8123
    CLICKHOUSE_DATABASE: str = "fleetpulse"
    REDIS_URL: str = "redis://localhost:6379/0"
    MONGO_URL: str = "mongodb://localhost:27017"

    # Kafka
    KAFKA_BOOTSTRAP_SERVERS: str = "localhost:9092"

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:3000", "*"]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
