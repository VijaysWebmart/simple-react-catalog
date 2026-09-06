# Add "Sign in with Google" to Noorvi

## What this involves

Google sign-in needs two halves: (1) configuration in your Google Cloud + Supabase dashboards (only you can do this, since it's your accounts), and (2) a "Continue with Google" button in the app (I'll build that).

## Plan

### Part A — You configure (I'll guide you, ~10 min)

1. **Google Cloud Console** (console.cloud.google.com):
   - Create/select a project → configure the OAuth consent screen (app name "Noorvi", your email).
   - Add your Supabase domain `vcrtrqublbczdcwhmejj.supabase.co` under Authorized domains.
   - Add scopes: `openid`, `.../auth/userinfo.email`, `.../auth/userinfo.profile`.
   - Create an **OAuth Client ID** (type: Web application).
   - Under Authorized redirect URLs, paste the callback URL shown in your Supabase dashboard (Authentication → Sign In / Providers → Google), which looks like:
     `https://vcrtrqublbczdcwhmejj.supabase.co/auth/v1/callback`
2. **Supabase Dashboard** (Authentication → Providers → Google):
   - Enable Google, paste the Client ID and Client Secret from step 1.
   - Under Authentication → URL Configuration, set Site URL to your published site and add redirect URLs for both preview and published URLs.

### Part B — I build (after you confirm Part A, or in parallel)

3. Add `signInWithGoogle()` to `AuthContext` using `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } })`.
4. Add a "Continue with Google" button (with Google logo) to `AuthPage.tsx` on both the Sign In and Sign Up tabs, with a divider from the email/password form.
5. On return from Google, the existing `onAuthStateChange` session handling takes over — profile creation for new Google users already works via the existing `handle_new_user` trigger (full name comes from Google metadata).
6. Admin access stays unchanged: Google sign-in only creates a customer account; admin rights still require an `admin_users` record.

### Verification

7. Test: click Continue with Google → consent screen → redirected back signed in → cart/checkout works → profile shows name/email from Google.
8. Test that existing email/password sign-in still works.

## Safety notes

- No database changes required — the existing profiles trigger handles new Google users.
- Client ID/secret live only in the Supabase dashboard, never in code.
- Nothing changes for existing email/password users.
