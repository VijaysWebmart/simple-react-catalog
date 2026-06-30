# Fix: Checkout fails + Cart page button does nothing

Two real bugs surfaced from the logs:

## Bug 1 — Every order insert fails with a foreign-key error
The `orders` table has an `orders_audit_trigger` that calls `public.log_admin_activity()` on every INSERT/UPDATE/DELETE. That function inserts a row into `activity_logs` with `admin_id = auth.uid()`. But `activity_logs.admin_id` has a FK to `admin_users(id)`, so when a normal customer (not an admin) places an order, the FK violates and the order insert is aborted:

```
Key (admin_id)=(3f8d38ff-…) is not present in table "admin_users".
```

This blocks both the old and the new Razorpay flow.

### Fix
Update `public.log_admin_activity()` to only log when the current user is actually an admin (skip silently otherwise). Same change protects the `products_audit_trigger` for any future non-admin product touches.

```sql
CREATE OR REPLACE FUNCTION public.log_admin_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.admin_users WHERE id = auth.uid()
  ) THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  INSERT INTO public.activity_logs (admin_id, action, table_name, record_id, old_values, new_values)
  VALUES (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN to_jsonb(NEW) ELSE NULL END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;
```

## Bug 2 — Cart page "Proceed to Checkout" button is dead
`src/pages/CartPage.tsx` line 128 renders a button with no `onClick`. The cart drawer correctly opens the new Razorpay `CheckoutForm`, but the dedicated `/cart` page button does nothing — so users assume "old gateway / nothing happens".

### Fix
Wire `CartPage` to the same `CheckoutForm` the drawer uses:
- Add `useState` for `checkoutOpen`.
- Make the button call `setCheckoutOpen(true)` (gated on `items.length > 0`).
- Render `<CheckoutForm isOpen={checkoutOpen} onClose={() => setCheckoutOpen(false)} />`.

No other code or schema changes. The Razorpay edge functions and `CheckoutForm` from the previous step stay as-is.

## Verification
1. Open `/cart` → click **Proceed to Checkout** → checkout modal opens.
2. Submit shipping form → Razorpay modal opens (no 409, no FK error).
3. Pay with test card `4111 1111 1111 1111` → order flips to `paid`, redirect to success page.
