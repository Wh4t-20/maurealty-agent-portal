import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # Use environment variable for the database URI
    # Default to a local postgres DB if not set (for testing purposes)
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/postgres')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
