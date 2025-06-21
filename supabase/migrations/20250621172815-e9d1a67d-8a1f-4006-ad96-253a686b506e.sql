
-- Create products table
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  images TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create slider_images table
CREATE TABLE public.slider_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  image_url TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
);

-- Create storage bucket for slider images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'slider-images',
  'slider-images',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
);

-- Create storage policies for product images
CREATE POLICY "Anyone can view product images" ON storage.objects
FOR SELECT USING (bucket_id = 'product-images');

CREATE POLICY "Anyone can upload product images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Anyone can update product images" ON storage.objects
FOR UPDATE USING (bucket_id = 'product-images');

CREATE POLICY "Anyone can delete product images" ON storage.objects
FOR DELETE USING (bucket_id = 'product-images');

-- Create storage policies for slider images
CREATE POLICY "Anyone can view slider images" ON storage.objects
FOR SELECT USING (bucket_id = 'slider-images');

CREATE POLICY "Anyone can upload slider images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'slider-images');

CREATE POLICY "Anyone can update slider images" ON storage.objects
FOR UPDATE USING (bucket_id = 'slider-images');

CREATE POLICY "Anyone can delete slider images" ON storage.objects
FOR DELETE USING (bucket_id = 'slider-images');

-- Insert some default slider images
INSERT INTO public.slider_images (title, subtitle, image_url, display_order) VALUES
('Summer Collection', 'Discover the latest trends', 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=400&fit=crop', 1),
('Best Deals', 'Up to 50% off on selected items', 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=1200&h=400&fit=crop', 2),
('New Arrivals', 'Fresh styles just landed', 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=1200&h=400&fit=crop', 3);
