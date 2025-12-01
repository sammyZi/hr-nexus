"""
Database initialization script
Creates indexes for all collections
"""
from database import create_indexes

if __name__ == "__main__":
    print("Initializing database indexes...")
    create_indexes()
    print("Database initialization complete!")
