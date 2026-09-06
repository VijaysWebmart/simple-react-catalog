# Fix Razorpay "Authentication failed" on Pay button

## What I found

The `razorpay-create-order` edge function logs show the key **is** present and correctly formatted (`mode=test`), but Razorpay itself rejects the credentials with `Authentication failed` (`BAD_REQUEST_ERROR`). This is Razorpay saying the **Key ID and Key Secret do not form a valid pair** — most commonly because:

- The Key Secret was regenerated in the Razorpay dashboard and the old secret is still saved here, or
- Key ID and Key Secret come from two different accounts/modes (test ID with live secret or vice versa), or
- A stray space/newline was pasted into the secret value.

The app code path is correct; this is a credentials mismatch, not a code bug.

## Plan

1. **Verify credentials safely (no code change yet)**
   - Call the deployed function once and check logs to confirm the stored key prefix and mode.
   - Confirm the error is Razorpay's auth rejection, not our 401/500 guards (already confirmed by logs).

2. **Re-save the matching key pair**
   - In the Razorpay Dashboard (Settings → API Keys), generate/confirm the **test-mode** Key ID + Key Secret as a pair.
   - Re-enter both `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in this project's secrets (secure form), pasted with no extra spaces.

3. **Add a cheap pre-flight credential check (optional but useful)**
   - In `razorpay-create-order`, before creating an order, call Razorpay's lightweight authenticated endpoint (e.g. `GET /v1/orders?count=1`) and return a clear `RAZORPAY_AUTH_FAILED` message if keys are rejected — so future credential issues surface as a readable message instead of a generic failure.

4. **Verify end to end**
   - Re-run the create-order call and confirm a Razorpay order id is returned.
   - Complete a test payment in the checkout and confirm the order moves to paid in the admin panel.

## Safety notes

- No changes to webhook, verify-payment, or order tables — those are working.
- Keys never leave the server side; nothing is exposed to the browser.
- Keeping test mode until you confirm live keys from Razorpay.
