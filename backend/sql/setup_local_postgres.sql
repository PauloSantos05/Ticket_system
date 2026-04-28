DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'bytes_app') THEN
    CREATE ROLE bytes_app WITH LOGIN PASSWORD 'admin123';
  ELSE
    ALTER ROLE bytes_app WITH LOGIN PASSWORD 'admin123';
  END IF;
END
$$;

-- Execute the database creation in a separate query (see create_database.sql).
