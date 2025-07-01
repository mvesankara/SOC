import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost:5432/socaas_db")
# In a real application, 'user:password@localhost:5432/socaas_db' should not be hardcoded as a default fallback.
# For local development, you would typically set this in a .env file.
# Example .env file:
# DATABASE_URL=postgresql://myuser:mypassword@localhost:5432/mydb
# SECRET_KEY=your_actual_strong_secret_key
# ALGORITHM=HS256
# ACCESS_TOKEN_EXPIRE_MINUTES=30

# JWT Settings
# IMPORTANT: In a production environment, SECRET_KEY should be loaded from an environment variable
# and should be a strong, randomly generated string.
# The value below is a placeholder generated for development.
SECRET_KEY = os.getenv("SECRET_KEY", "cc18b4f4152301657349d651a05bd2b3b14bb4ebe1dbb65ede3492074f23b40f")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
