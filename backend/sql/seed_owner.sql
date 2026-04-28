INSERT INTO employees (username, email, password_hash, role, job_title, employment_status)
VALUES ('Owner ByteSolutions', 'owner@bytesolutions.com', '$2b$10$yz5zmPFFB0C6llG5ImktF./gOqWwNX0gocZdT.fMxEz3p7xgrsyfm', 'Owner', 'Owner', 'active')
ON CONFLICT (email) DO NOTHING;
