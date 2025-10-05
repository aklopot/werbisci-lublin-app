#!/usr/bin/env python3
"""
Safe migration script to add description column to addresses table.
This script can be run multiple times safely.
"""

import sys
from pathlib import Path

# Add the app directory to Python path
sys.path.insert(0, str(Path(__file__).parent / "app"))

from app.core.db import SessionLocal
from sqlalchemy import text


def check_column_exists(db_session, table_name: str, column_name: str) -> bool:
    """Check if a column exists in the table."""
    try:
        # SQLite specific query to check column existence
        result = db_session.execute(text(f"""
            SELECT COUNT(*) as count
            FROM pragma_table_info('{table_name}')
            WHERE name = '{column_name}'
        """))
        count = result.scalar()
        return count > 0
    except Exception as e:
        print(f"Error checking column existence: {e}")
        return False


def add_description_column(db_session):
    """Add description column to addresses table if it doesn't exist."""
    try:
        # Check if column already exists
        if check_column_exists(db_session, 'addresses', 'description'):
            print("Column 'description' already exists in addresses table. "
                  "Skipping migration.")
            return True

        # Add the column
        db_session.execute(text("""
            ALTER TABLE addresses
            ADD COLUMN description VARCHAR(500) NULL
        """))

        db_session.commit()
        print("Successfully added 'description' column to addresses table.")
        return True

    except Exception as e:
        print(f"Error adding description column: {e}")
        db_session.rollback()
        return False


def main():
    """Main migration function."""
    print("Starting migration: Adding description column to addresses "
          "table...")

    # Check if database file exists
    db_path = Path("data/werbisci-app.db")
    if not db_path.exists():
        print(f"Database file not found at {db_path}")
        print("Please run this script from the backend directory.")
        return False

    # Create database session
    db_session = SessionLocal()

    try:
        success = add_description_column(db_session)
        if success:
            print("Migration completed successfully!")
            return True
        else:
            print("Migration failed!")
            return False
    finally:
        db_session.close()


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
