-- Add password change tracking fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_default_password BOOLEAN DEFAULT FALSE;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_users_password_changed ON users(password_changed_at);

-- Update existing users to mark default passwords
UPDATE users 
SET is_default_password = TRUE, password_changed_at = created_at 
WHERE email IN ('admin@uta.com', 'operador1@uta.com', 'operador2@uta.com', 'operador3@uta.com', 'operador4@uta.com', 'viewer@uta.com', 'viewer2@uta.com');

-- Add comment for documentation
COMMENT ON COLUMN users.password_changed_at IS 'Timestamp when password was last changed';
COMMENT ON COLUMN users.is_default_password IS 'Flag to indicate if user is using default password that needs to be changed';
