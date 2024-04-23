-- This script seeds the targeted database with sample data

-- Create the 'users' table if it does not exist
-- The table structure: id (SERIAL PRIMARY KEY), name (VARCHAR), email (VARCHAR)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(100)
);

-- Inserting sample data into the 'users' table
INSERT INTO users (name, email) VALUES ('Jule Nisse', 'julenisse@polar.no');
INSERT INTO users (name, email) VALUES ('Jule Maja', 'julemaja@polar.no');
INSERT INTO users (name, email) VALUES ('oh-deer', 'oh-deer@polar.no');
