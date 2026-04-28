CREATE TABLE IF NOT EXISTS employees (
  id SERIAL PRIMARY KEY,
  username VARCHAR(120) NOT NULL,
  email VARCHAR(180) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(80) NOT NULL CHECK (role IN ('Owner', 'Technical Support', 'Network', 'HR', 'System Analysis', 'Administration')),
  job_title VARCHAR(120),
  employment_status VARCHAR(30) NOT NULL DEFAULT 'active' CHECK (employment_status IN ('active', 'deactivated')),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tickets (
  id SERIAL PRIMARY KEY,
  title VARCHAR(220) NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  priority VARCHAR(30) NOT NULL CHECK (priority IN ('too High', 'High', 'Normal', 'low', 'too low')),
  role_group VARCHAR(80) NOT NULL CHECK (role_group IN ('Technical Support', 'Network', 'HR', 'System Analysis', 'Administration')),
  requester_employee_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
  requester_group VARCHAR(80) NOT NULL CHECK (requester_group IN ('Technical Support', 'Network', 'HR', 'System Analysis', 'Administration')),
  applied_by_employee_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
  created_by_employee_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
  status VARCHAR(30) NOT NULL CHECK (status IN ('Finished', 'Opened', 'Follow up'))
);

CREATE TABLE IF NOT EXISTS follow_ups (
  id SERIAL PRIMARY KEY,
  ticket_id INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
