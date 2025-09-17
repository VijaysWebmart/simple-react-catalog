
import { create } from 'zustand';
import { supabase } from '../integrations/supabase/client';

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  description: string;
  images: string[];
  sku?: string;
  stock_quantity?: number;
  is_active?: boolean;
  is_featured?: boolean;
  variants?: any;
  created_at?: string;
  updated_at?: string;
}

interface ProductStore {
  products: Product[];
  loading: boolean;
  fetchProducts: () => Promise<void>;
  addProduct: (product: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateProduct: (product: Product) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  uploadProductImages: (files: File[]) => Promise<string[]>;
}

export const useProductStore = create<ProductStore>((set, get) => ({
  products: [],
  loading: false,

  fetchProducts: async () => {
    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching products:', error);
        return;
      }

      set({ products: data || [] });
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      set({ loading: false });
    }
  },

  addProduct: async (productData) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .insert([productData])
        .select()
        .single();

      if (error) {
        console.error('Error adding product:', error);
        return;
      }

      set((state) => ({
        products: [data, ...state.products]
      }));
    } catch (error) {
      console.error('Error adding product:', error);
    }
  },

  updateProduct: async (updatedProduct) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .update({
          name: updatedProduct.name,
          price: updatedProduct.price,
          category: updatedProduct.category,
          description: updatedProduct.description,
          images: updatedProduct.images,
          updated_at: new Date().toISOString()
        })
        .eq('id', updatedProduct.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating product:', error);
        return;
      }

      set((state) => ({
        products: state.products.map((product) =>
          product.id === updatedProduct.id ? data : product
        )
      }));
    } catch (error) {
      console.error('Error updating product:', error);
    }
  },

  deleteProduct: async (id) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting product:', error);
        return;
      }

      set((state) => ({
        products: state.products.filter((product) => product.id !== id)
      }));
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  },

  uploadProductImages: async (files: File[]) => {
    const uploadedUrls: string[] = [];

    for (const file of files) {
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
        const filePath = `products/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(filePath, file);

        if (uploadError) {
          console.error('Error uploading file:', uploadError);
          continue;
        }

        const { data } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath);

        uploadedUrls.push(data.publicUrl);
      } catch (error) {
        console.error('Error uploading file:', error);
      }
    }

    return uploadedUrls;
  }
}));
