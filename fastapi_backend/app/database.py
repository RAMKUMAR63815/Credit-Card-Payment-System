# Import os module to read environment variables
import os

# Load variables from the .env file
from dotenv import load_dotenv

# Import SQLAlchemy function to create database connection
from sqlalchemy import create_engine

# Import tools to create database models and database sessions
from sqlalchemy.orm import declarative_base, sessionmaker


# Load the variables from the .env file
load_dotenv()


# Read database name from environment variable
# If DB_NAME is not available, use "credit_card_db"
DB_NAME = os.getenv("DB_NAME", "credit_card_db")

# Read database username
# If DB_USER is not available, use "credit_app"
DB_USER = os.getenv("DB_USER", "credit_app")

# Read database password
# If DB_PASSWORD is not available, use "credit_password"
DB_PASSWORD = os.getenv("DB_PASSWORD", "credit_password")

# Read database host
# "mysql" is the MySQL Docker service name
DB_HOST = os.getenv("DB_HOST", "mysql")

# Read database port
# MySQL normally runs on port 3306
DB_PORT = os.getenv("DB_PORT", "3306")


# Build the complete MySQL database connection URL
# mysql+pymysql = use MySQL database with PyMySQL driver
DATABASE_URL = (
    f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}"
    f"@{DB_HOST}:{DB_PORT}/{DB_NAME}"
)


# Create the SQLAlchemy database engine
# The engine manages connections between FastAPI and MySQL
engine = create_engine(
    DATABASE_URL,

    # Check whether an existing database connection is still alive
    # before using it
    pool_pre_ping=True
)


# Create a session factory
# Each database operation can create a new database session
SessionLocal = sessionmaker(
    # We manually control when transactions are committed
    autocommit=False,

    # Don't automatically flush changes before every query
    autoflush=False,

    # Connect these sessions to our database engine
    bind=engine
)


# Create the base class for SQLAlchemy models
# Example: class User(Base): ...
Base = declarative_base()


# Dependency function used by FastAPI routes
def get_db():

    # Create a new database session
    db = SessionLocal()

    try:
        # Give the database session to the API route
        # yield pauses this function and provides db to the route
        yield db

    finally:
        # Close the database session after the request is completed
        # This prevents database connections from remaining open
        db.close()