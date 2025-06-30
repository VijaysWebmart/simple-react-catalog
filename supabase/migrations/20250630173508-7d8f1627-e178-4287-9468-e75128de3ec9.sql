
-- Create admin users table for role-based access
CREATE TABLE public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin',
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create activity logs table for audit trail
CREATE TABLE public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES admin_users(id),
  action TEXT NOT NULL,
  table_name TEXT,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add inventory and product management fields to products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sku TEXT UNIQUE;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS variants JSONB DEFAULT '[]';

-- Create categories table
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  parent_id UUID REFERENCES categories(id),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add shipping information to orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_method TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tracking_number TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_partner TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS estimated_delivery TIMESTAMPTZ;

-- Create payment transactions table
CREATE TABLE public.payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id),
  transaction_id TEXT,
  gateway TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'INR',
  status TEXT NOT NULL,
  gateway_response JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create store settings table
CREATE TABLE public.store_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create shipping zones table
CREATE TABLE public.shipping_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  countries TEXT[] DEFAULT '{"India"}',
  states TEXT[],
  postal_codes TEXT[],
  shipping_rate NUMERIC NOT NULL DEFAULT 0,
  free_shipping_threshold NUMERIC,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_zones ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for admin access
CREATE POLICY "Admin users can manage admin_users" ON public.admin_users FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin users can view activity_logs" ON public.activity_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin users can manage categories" ON public.categories FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin users can view payment_transactions" ON public.payment_transactions FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin users can manage store_settings" ON public.store_settings FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin users can manage shipping_zones" ON public.shipping_zones FOR ALL TO authenticated USING (true);

-- Insert default store settings
INSERT INTO public.store_settings (key, value) VALUES
('store_info', '{"name": "My Store", "address": "", "phone": "", "email": ""}'),
('currency', '"INR"'),
('tax_rate', '18'),
('email_notifications', '{"order_placed": true, "order_shipped": true, "order_delivered": true}'),
('payment_gateways', '{"phonepe": {"enabled": true}, "stripe": {"enabled": false}, "razorpay": {"enabled": false}}');

-- Insert default categories
INSERT INTO public.categories (name, slug) VALUES
('Electronics', 'electronics'),
('Clothing', 'clothing'),
('Books', 'books'),
('Home & Garden', 'home-garden');

-- Create function to log admin activities
CREATE OR REPLACE FUNCTION log_admin_activity()
RETURNS TRIGGER AS $$
BEGIN
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
$$ LANGUAGE plpgsql;

-- Create triggers for audit logging
CREATE TRIGGER products_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.products
  FOR EACH ROW EXECUTE FUNCTION log_admin_activity();

CREATE TRIGGER orders_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION log_admin_activity();
