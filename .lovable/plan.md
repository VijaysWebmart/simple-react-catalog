## Problem

The homepage shows "No products available" and the slider is empty. Root cause confirmed via the database:

- `products` and `slider_images` both have **RLS enabled** but **zero policies defined**.
- With RLS on and no SELECT policy, PostgREST returns 0 rows to both `anon` and `authenticated` users — even though the data exists.

The previous migration enabled RLS on these tables but did not (re)create the public-read and admin-manage policies, so the storefront can no longer fetch them.

## Fix

Add the missing policies (and confirm the Data API grants) in one migration:

**`products`**
- Public read for everyone (anon + authenticated): `USING (true)` — products are catalog data meant to be browsed without login.
- Admin manage (INSERT/UPDATE/DELETE) for authenticated users (matches existing pattern used on `categories`, `store_settings`, etc.).
- Ensure `GRANT SELECT` to `anon` and full CRUD to `authenticated` + `service_role`.

**`slider_images`**
- Public read for everyone: `USING (is_active = true)` so only active slides are exposed publicly.
- Admin manage for authenticated users.
- Same GRANT block as above.

## Out of scope

- No changes to `cart`, `orders`, `profiles`, or any auth-scoped table — those policies are correct.
- No frontend code changes; `ProductGrid` and `ImageSlider` already query correctly and will start returning rows as soon as the policies exist.

## Verification after apply

1. Reload `/` — featured products grid populates and the image slider renders.
2. Admin panel can still create/edit/delete products and slider images while logged in.
