ALTER TABLE tickets
  ADD COLUMN IF NOT EXISTS requester_employee_id INTEGER REFERENCES employees(id) ON DELETE SET NULL;

ALTER TABLE tickets
  ADD COLUMN IF NOT EXISTS requester_group VARCHAR(80);

UPDATE tickets
SET requester_group = role_group
WHERE requester_group IS NULL;

ALTER TABLE tickets
  ALTER COLUMN requester_group SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'tickets_requester_group_check'
  ) THEN
    ALTER TABLE tickets
      ADD CONSTRAINT tickets_requester_group_check
      CHECK (requester_group IN ('Technical Support', 'Network', 'HR', 'System Analysis', 'Administration'));
  END IF;
END
$$;
