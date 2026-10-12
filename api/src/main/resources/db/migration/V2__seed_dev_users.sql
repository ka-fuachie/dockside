INSERT INTO users (username, password_hash, role) VALUES
  ('admin', '$2a$10$RXCxNWiEHc.cy98nRbFUQ.WBX/4RcaDZt6F5Bl./PvrwrkrUkPe4q', 'ADMIN'), -- password: admin123
  ('dev', '$2a$10$HZUZHMauC3YJyMQZgwLHDOSMwjhvyh7tZDL56..eDsM9nEoATkSHW', 'DEV') -- password: dev123
  ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash;
