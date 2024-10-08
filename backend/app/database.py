import os
from sqlmodel import SQLModel
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.orm import sessionmaker
from app.settings import settings

PG_USERNAME = "logindb"
PG_PASSWORD = os.getenv("PG_PASSWORD")
HOST = "app-5f9fda3c-9416-44fa-a801-87784291f287-do-user-15512450-0.l.db.ondigitalocean.com"
DATABASENAME = "logindb"
DATABASE_URL = (
    f"postgresql+asyncpg://{PG_USERNAME}:{PG_PASSWORD}@{HOST}:25060/{DATABASENAME}"
)

print("Creating DB with connection string", DATABASE_URL)
engine = create_async_engine(DATABASE_URL, echo=True, future=True)


# This must be called *after* all models have been imported
async def initialize_database():
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)


async def get_session() -> AsyncSession:  # type: ignore
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with async_session() as session:
        yield session
