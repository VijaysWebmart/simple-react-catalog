## Super-admin recovery and Razorpay failure handling

### What I found

- The latest Razorpay requests reached the gateway successfully and created payment orders. The two recent failures came back from Razorpay as: **“This business accepts domestic (Indian) card payments only.”** Amounts in the app and database match, so this is not an add-to-cart or calculation failure.
- Admin login currently checks a custom admin table and trusts browser storage after login. That cannot safely support Supabase email recovery, because the admin account is not using Supabase Auth sessions.

### Build

1. **Move admin identity to secure Supabase Auth**
   - Add a separate role table with `super_admin` and `admin` roles, protected by row-level security.
   - Link admin access to authenticated user IDs instead of trusting browser storage or exposing password records.
   - Preserve the current admin records as management data while removing plaintext-password authentication from the active login path.
   - Add server-side role verification before showing or operating the admin panel.

2. **Add super-admin email password reset**
   - Add “Forgot password?” to the admin login screen.
   - Send a Supabase recovery email to the entered super-admin email.
   - Add a public `/admin/reset-password` page that validates the recovery session, enforces a strong password, and updates it securely.
   - After reset, return the user to admin login; do not expose whether an arbitrary email is registered.

3. **Improve Razorpay failed-payment behavior**
   - Keep server-side order creation and webhook verification unchanged because they are succeeding.
   - Show Razorpay’s specific failure reason in the checkout result instead of only a generic failure message.
   - For the current domestic-card restriction, tell the shopper to retry with an Indian-issued test card or another enabled test payment method.
   - Keep failed orders and transaction records for audit, and allow a clean retry without duplicating cart/order data unnecessarily.

4. **Verification**
   - Verify unauthorized users cannot open the admin panel by editing browser storage.
   - Test admin login, recovery-link handling, password update, logout, and login with the new password.
   - Test Razorpay success, explicit failure, modal dismissal, and retry paths; confirm order and transaction statuses match each outcome.

### Technical notes

- Passwords will be managed by Supabase Auth, not stored or compared as plaintext in `admin_users`.
- Admin authorization will use a dedicated role table and a security-definer role-check function to avoid recursive row-level-security rules.
- Existing Razorpay keys are valid test keys; the observed failure is an account/payment-method restriction returned by Razorpay, not a broken API integration.
- The reset email uses Supabase’s authentication email flow and redirects to `/admin/reset-password`.
