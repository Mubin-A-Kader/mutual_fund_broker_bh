from logging.config import fileConfig

from sqlalchemy import engine_from_config
from sqlalchemy import pool

from alembic import context
import os
import sys
from dotenv import load_dotenv
load_dotenv()
# Add the project root directory to the Python path
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

# Import your models
from app.database import Base
from app.models import *  # Import all your models here

# this is the Alembic Config object
config = context.config

# Get the URL from environment variable, using aiosqlite
database_url = os.getenv("DATABASE_URL_", "sqlite+aiosqlite:///./mutual_fund.db")
# Convert async URL to sync URL for Alembic
sync_database_url = database_url.replace("sqlite+aiosqlite:", "sqlite:")
config.set_main_option('sqlalchemy.url', sync_database_url)

# Interpret the config file for Python logging
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata

def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
