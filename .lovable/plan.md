# Razorpay Payment Gateway Integration Plan

Replace the existing PhonePe flow with Razorpay using a secure server-side pattern: order creation and signature verification happen in Supabase Edge Functions, never in the browser.

## Goals
- Accept payments via Razorpay Checkout (cards, UPI, netbanking, wallets).
- Keep API secret server-side only.
- Cryptographically verify every payment before marking an order as paid.
- Minimal frontend changes — same Checkout form UX.

## Secrets (server-side only)
Add via `add_secret` (never committed, never exposed to client):
- `RAZORPAY_KEY_ID` — public-ish key id (used in Checkout).
- `RAZORPAY_KEY_SECRET` — secret, only inside edge functions.
- `RAZORPAY_WEBHOOK_SECRET` — for webhook signature verification.

`RAZORPAY_KEY_ID` is also exposed back to the frontend via the create-order function's response (not hardcoded in client), so we don't need a `VITE_` variable.

## Database changes (single migration)
1. Add columns to `orders`:
   - `razorpay_order_id text`
   - `razorpay_payment_id text`
   - `razorpay_signature text`
   - Index on `razorpay_order_id`.
2. Keep existing PhonePe columns for historical orders (nullable). No data loss.
3. Ensure `payment_transactions` has `provider text` (default `'razorpay'`) and stores raw webhook events for audit.
4. Reconfirm RLS + GRANTs on `orders`, `order_items`, `payment_transactions` (user can read own; service_role full access for functions).

## Edge Functions (3 new, replace `phonepe-payment`)

### 1. `razorpay-create-order`
- Auth: requires logged-in user (verify JWT via `getClaims`).
- Input: `{ orderId }` (the row already inserted by the client in `orders` with status `pending`).
- Server re-computes the amount from `order_items` × `products.price` (do NOT trust client-supplied amount — prevents price tampering).
- Calls Razorpay `POST /v1/orders` with server-computed amount, currency `INR`, `receipt = orderId`.
- Stores `razorpay_order_id` on the order row.
- Returns `{ razorpayOrderId, amount, currency, keyId }` to client.

### 2. `razorpay-verify-payment`
- Auth: requires logged-in user.
- Input: `{ orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature }`.
- Recomputes HMAC-SHA256 of `${razorpay_order_id}|${razorpay_payment_id}` using `RAZORPAY_KEY_SECRET` and compares (constant-time) with provided signature.
- On match: update order `status = 'paid'`, store payment id + signature, insert `payment_transactions` row.
- On mismatch: mark `status = 'failed'`, return 400.

### 3. `razorpay-webhook` (public, no JWT)
- Verifies `X-Razorpay-Signature` header against raw body using `RAZORPAY_WEBHOOK_SECRET`.
- Handles `payment.captured`, `payment.failed`, `order.paid` — idempotent updates to `orders` keyed by `razorpay_order_id`.
- Acts as a safety net if the user closes the browser before the verify call completes.
- Logs every event into `payment_transactions`.

All three functions include CORS headers and consume response bodies.

## Frontend changes

### `src/components/CheckoutForm.tsx`
1. Insert pending order + order items (as today), but without the PhonePe transaction id.
2. Call `razorpay-create-order` → get `{ razorpayOrderId, amount, currency, keyId }`.
3. Dynamically load `https://checkout.razorpay.com/v1/checkout.js` (only when checkout opens).
4. Open Razorpay Checkout with prefill from the shipping form (name, email, phone), theme color matching brand.
5. In the `handler` callback, call `razorpay-verify-payment` with the returned ids + signature.
6. On success → clear cart, redirect to `/payment-callback?orderId=...&status=success`.
7. On dismiss/failure → keep order as `pending`/`failed`, show toast.

### `src/pages/PaymentCallbackPage.tsx`
- Simplify: just reads `orderId` + `status` from query and shows confirmation. No DB writes here (verification already happened server-side).

### Cleanup
- Remove/retire `supabase/functions/phonepe-payment/index.ts` (or leave for old orders; new flow won't call it).
- Delete `PHONEPE_CLIENT_ID` / `PHONEPE_CLIENT_SECRET` from secrets after confirming no traffic.

## Security checklist
- Secret key never leaves edge functions.
- Amount always recomputed server-side from DB before creating Razorpay order.
- Signature verified with HMAC-SHA256, constant-time compare.
- Webhook verified independently and idempotent.
- All write endpoints require Supabase JWT (`getClaims`) except the webhook.
- RLS prevents users from updating other users' orders; only edge functions (service_role) mutate `status`.
- No secret values logged.

## Verification after build
1. Test mode keys: place an order with Razorpay test card `4111 1111 1111 1111` → order flips to `paid`.
2. Failure card → order stays `failed`, cart not cleared.
3. Tamper test: change amount in browser before submit → server recomputes, Razorpay order still uses correct amount.
4. Webhook test via Razorpay dashboard → `payment_transactions` row inserted, order status idempotent.

## Out of scope
- Refunds UI (can be added later via a `razorpay-refund` function).
- Saved cards / subscriptions.
- Multi-currency (INR only for now).

## What I need from you before building
1. Confirm switch from PhonePe → Razorpay (PhonePe code retired for new orders).
2. You'll provide Razorpay **Key ID**, **Key Secret**, and **Webhook Secret** when prompted via the secure secrets form.
3. Confirm currency is INR.
