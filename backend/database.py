from databases import Database
from sqlalchemy import create_engine, MetaData
from .config import DATABASE_URL

database = Database(DATABASE_URL)
metadata = MetaData()

# SQLAlchemy engine (primarily for ORM model definitions and initial table creation)
# The 'databases' library handles async connections directly using the DATABASE_URL string.
# However, SQLAlchemy's engine is still useful for defining table metadata.
engine = create_engine(DATABASE_URL)

async def connect_db():
    """Connects to the database."""
    await database.connect()

async def disconnect_db():
    """Disconnects from the database."""
    await database.disconnect()
