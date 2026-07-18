## Add new admin user

Insert a new row into `public.admin_users` with:

- **email:** `vijay@gmail.com`
- **password_hash:** `Email@1234` (stored as plain text — matches the existing login check in `AdminLogin.tsx`)
- **full_name:** `Vijay`
- **role:** `admin`
- **is_active:** `true`

### Technical detail
Runs a single `INSERT` via the data tool. No schema changes, no code changes. After this, the user can log in at `/admin` with the new credentials.

### Security note
Passwords are currently stored in plain text in `admin_users.password_hash` and compared directly at login. This is insecure. I'd recommend a follow-up to hash passwords (bcrypt via an edge function) — let me know if you want that next.