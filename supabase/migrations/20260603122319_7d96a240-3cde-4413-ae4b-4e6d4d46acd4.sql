-- Public read + admin manage policies for products
CREATE POLICY "Public can view products"
ON public.products FOR SELECT
USING (true);

CREATE POLICY "Authenticated can manage products"
ON public.products FOR ALL
TO authenticated
USING (true) WITH CHECK (true);

GRANT SELECT ON public.products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;

-- Public read + admin manage policies for slider_images
CREATE POLICY "Public can view active slider images"
ON public.slider_images FOR SELECT
USING (is_active = true);

CREATE POLICY "Authenticated can manage slider images"
ON public.slider_images FOR ALL
TO authenticated
USING (true) WITH CHECK (true);

GRANT SELECT ON public.slider_images TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.slider_images TO authenticated;
GRANT ALL ON public.slider_images TO service_role;