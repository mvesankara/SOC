import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost:5432/socaas_db")
# In a real application, 'user:password@localhost:5432/socaas_db' should not be hardcoded as a default fallback.
# For local development, you would typically set this in a .env file.
# Example .env file:
# DATABASE_URL=postgresql://myuser:mypassword@localhost:5432/mydb
