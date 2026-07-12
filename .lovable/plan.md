# Payment Reliability Plan (Razorpay Test Mode)

## What I found in your data

- Recent orders show the flow *does* work end-to-end (multiple `status: paid`).
- Two orders on 30-Jun ended in `status: failed` — these came from the webhook's `payment.failed` event, meaning Razorpay itself declined the transaction (expected when using the failing test card `4111 1111 1111 1111` or when the user cancels an OTP). That is not a bug — it is Razorpay reporting a real decline.
- Real issues in the current code that make failures look worse than they are and can cause future silent failures:
  1. **Client `payment.failed` handler only shows a toast** — the DB order stays `pending` forever, so users see "payment failed" but can never retry cleanly and admin sees phantom pending orders (e.g. `4803431c…` from 30-Jun).
  2. **Modal dismiss** leaves the order `pending` with no cleanup or "resume payment" path.
  3. **`payment_transactions` has duplicate rows** for the same `transaction_id` (webhook fires twice, plus client verify inserts a third) — no unique constraint, no idempotency.
  4. **No key-mode validation** in the edge function — if a live key ever gets pasted into `RAZORPAY_KEY_ID`/`RAZORPAY_KEY_SECRET` while testing (or vice-versa), you get an opaque "Failed to initiate payment" with no hint why.
  5. **Verify function doesn't compare `amount`/`currency`** returned from Razorpay against the stored order — a mismatched-currency edge case would still be marked `paid`.
  6. **Generic frontend error** ("Failed to initiate payment. Please try again.") hides the real cause; the edge function's structured error is not shown.

## Changes

### 1. Frontend — `src/components/CheckoutForm.tsx`
- On Razorpay `payment.failed`: call a new `razorpay-mark-failed` edge function (or reuse verify with a `failed` flag) to mark the order `failed` + insert a transaction row, then redirect to `/payment-callback?status=failed&order_id=…`.
- On `modal.ondismiss`: leave the order `pending` but show a "Resume payment" toast that re-opens Razorpay for the same order (reuses existing `razorpay_order_id`).
- Surface the real error message from `supabase.functions.invoke` (`error.context?.error`) in the toast instead of the generic one.

### 2. Edge function — `razorpay-create-order`
- Add key-mode guard: reject if `RAZORPAY_KEY_ID` doesn't start with `rzp_test_` (test) or `rzp_live_` (live) and log the prefix (never the secret).
- If the order already has a `razorpay_order_id` and is still `pending`, return the existing RP order instead of creating a new one → enables "resume payment" and prevents duplicate RP orders.
- Return structured JSON on error (`{ error, code }`) so the client can show it.

### 3. Edge function — `razorpay-verify-payment`
- Fetch the payment from Razorpay's API (`GET /v1/payments/:id`) and verify `amount === order.total_amount * 100` and `currency === 'INR'` and `status === 'captured'` before marking paid.
- Make the update idempotent: if `orders.status` is already `paid`, return success without re-inserting a transaction row.

### 4. Edge function — `razorpay-webhook`
- Skip insert when a `payment_transactions` row with the same `transaction_id` + `status` already exists (idempotency).
- Keep signature check as-is.

### 5. DB migration (safe, additive)
```sql
-- de-dup existing rows first, then enforce uniqueness
DELETE FROM public.payment_transactions a
USING public.payment_transactions b
WHERE a.ctid < b.ctid
  AND a.transaction_id = b.transaction_id
  AND a.status = b.status;

ALTER TABLE public.payment_transactions
  ADD CONSTRAINT payment_transactions_txn_status_unique
  UNIQUE (transaction_id, status);
```
No table creation, no RLS changes, no destructive drops.

### 6. New edge function — `razorpay-mark-failed`
Auth'd endpoint that marks an order `failed` and records the failure reason from Razorpay's `error_code` / `error_description` in `payment_transactions.gateway_response`. Prevents "phantom pending" orders when the user's card is declined mid-checkout.

## What I will NOT touch
- Razorpay keys, webhook secret, or any other stored secret.
- Existing successful orders / transactions.
- Admin panel, cart, or product code paths.
- RLS policies.

## Test checklist after implementation
1. Success card `4111 1111 1111 1111` → order becomes `paid`, exactly one `client_verify` transaction (webhook rows deduped).
2. Failure card `5104 0155 5555 5558` → order becomes `failed`, callback page shows failure, user can retry from cart.
3. Close Razorpay modal without paying → order stays `pending`; "Resume payment" reopens same RP order (no new one created).
4. Paste a `rzp_live_` key with test mode → create-order returns a clear `Key mode mismatch` error surfaced in the UI.
