## Goals

1. Let users save multiple shipping addresses, reuse them at checkout, and mark one as default.
2. Show a default profile avatar (with optional upload) on the profile page and in the header.
3. Add a floating WhatsApp chat button site-wide.

---

## 1. Saved Shipping Addresses

**New table `public.addresses`** (via migration, with GRANTs + RLS):
- `id uuid pk`, `user_id uuid` (references profiles), `full_name`, `phone`, `address`, `city`, `state`, `pincode`, `is_default boolean`, `created_at`.
- RLS: users can select/insert/update/delete only their own rows. Trigger to ensure only one `is_default = true` per user.

**Profile page (`ProfilePage.tsx`)** — new "My Addresses" section:
- List saved addresses as cards with Edit / Delete / "Set as default" actions.
- "Add new address" form (same fields as checkout).

**Checkout (`CheckoutForm.tsx`)** rework:
- On open, fetch saved addresses.
- If any exist: show them as selectable cards (default pre-selected) + "Use a new address" toggle that reveals the existing form.
- New addresses get an optional "Save this address" checkbox (defaults on); first-ever address auto-becomes default.
- Selected address is sent as `shipping_address` JSON to the order (no schema change to `orders`).

**Cart page** — small "Deliver to: <default address summary>  · Change" line above the Order Summary when a default exists, linking to profile addresses.

---

## 2. Profile Image

- Add `avatar_url text` column to `profiles` (migration).
- `ProfilePage.tsx`: avatar block at top using shadcn `Avatar` with a default placeholder image (initials fallback). "Change photo" uploads to existing `product-images` bucket under an `avatars/` prefix — or create a new public `avatars` bucket (preferred; created via storage tool).
- `AuthenticatedHeader.tsx`: replace the current account icon with the `Avatar` showing `avatar_url` or initials fallback.

---

## 3. WhatsApp Chat Button

- New `src/components/WhatsAppButton.tsx`: fixed bottom-right floating button (green circle, WhatsApp icon from `lucide-react`), opens `https://wa.me/<number>?text=...` in a new tab.
- Mounted once in `src/App.tsx` so it appears on every page.
- Phone number read from `store_settings` (existing table) with a hardcoded fallback, so admin can change it later without a code edit.

---

## Technical Notes

- Migrations: `addresses` table + grants + RLS + default-uniqueness trigger; `profiles.avatar_url` column; optional `avatars` storage bucket with public read + owner-write policies.
- No changes to Razorpay edge functions — `shipping_address` continues to be sent as JSON on the order insert.
- No business-logic change to order creation flow beyond which address object is attached.

---

## Open Question

What WhatsApp number should the button use by default? (I'll wire it to `store_settings` so it's editable later, but I need a starting value.)
