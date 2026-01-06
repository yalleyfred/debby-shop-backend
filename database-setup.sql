-- Database setup script for Debby Shop Backend
-- Run this script as PostgreSQL superuser (usually 'postgres')

-- Create database
CREATE DATABASE debby_shop;

-- Create user (optional - you can use existing postgres user)
-- CREATE USER debby_shop_user WITH ENCRYPTED PASSWORD 'your_secure_password';

-- Grant privileges (if using custom user)
-- GRANT ALL PRIVILEGES ON DATABASE debby_shop TO debby_shop_user;

-- Connect to the database and grant schema privileges (if using custom user)
-- \c debby_shop;
-- GRANT ALL ON SCHEMA public TO debby_shop_user;