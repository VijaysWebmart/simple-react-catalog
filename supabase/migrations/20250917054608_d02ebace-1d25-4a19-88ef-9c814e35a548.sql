-- Fix activity_logs RLS to allow inserts from app and triggers
-- Allow INSERTs into activity_logs for authenticated users (admin context)
CREATE POLICY "Allow insert to activity_logs" ON public.activity_logs
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Update the log_admin_activity function to run with definer rights
CREATE OR REPLACE FUNCTION public.log_admin_activity()
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;