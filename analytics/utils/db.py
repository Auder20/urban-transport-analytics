from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from sqlalchemy import MetaData
import asyncio
from typing import AsyncGenerator

from config.settings import settings

# Create async engine
engine = create_async_engine(
    settings.database_url.replace("postgresql://", "postgresql+asyncpg://"),
    echo=settings.debug,
    pool_size=20,
    max_overflow=30,
    pool_pre_ping=True,
    pool_recycle=3600,
)

# Create async session factory
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

# Create base model class
Base = declarative_base()

# Metadata for migrations
metadata = MetaData()


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency to get database session"""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db():
    """Initialize database tables"""
    async with engine.begin() as conn:
        # Import all models here to ensure they are registered
        # Base is already defined in this file
        await conn.run_sync(Base.metadata.create_all)


async def close_db():
    """Close database connections"""
    await engine.dispose()


# Test database connection
async def test_connection():
    """Test database connection"""
    try:
        async with engine.begin() as conn:
            await conn.execute("SELECT 1")
        print("✅ PostgreSQL connection successful")
        return True
    except Exception as e:
        print(f"❌ PostgreSQL connection failed: {e}")
        return False
