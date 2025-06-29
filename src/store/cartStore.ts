
import { create } from 'zustand';
import { supabase } from '../integrations/supabase/client';

interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  product?: {
    name: string;
    price: number;
    images: string[];
  };
}

interface CartStore {
  items: CartItem[];
  loading: boolean;
  fetchCartItems: () => Promise<void>;
  addToCart: (productId: string, quantity?: number) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  getCartTotal: () => number;
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  loading: false,

  fetchCartItems: async () => {
    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from('cart')
        .select(`
          *,
          product:products(name, price, images)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching cart items:', error);
        return;
      }

      set({ items: data || [] });
    } catch (error) {
      console.error('Error fetching cart items:', error);
    } finally {
      set({ loading: false });
    }
  },

  addToCart: async (productId: string, quantity = 1) => {
    try {
      // Check if item already exists in cart
      const { data: existingItem } = await supabase
        .from('cart')
        .select('*')
        .eq('product_id', productId)
        .single();

      if (existingItem) {
        // Update quantity if item exists
        const newQuantity = existingItem.quantity + quantity;
        await supabase
          .from('cart')
          .update({ quantity: newQuantity })
          .eq('product_id', productId);
      } else {
        // Add new item to cart
        await supabase
          .from('cart')
          .insert([{ 
            product_id: productId, 
            quantity,
            user_id: (await supabase.auth.getUser()).data.user?.id
          }]);
      }

      // Refresh cart items
      get().fetchCartItems();
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  },

  updateQuantity: async (productId: string, quantity: number) => {
    try {
      if (quantity <= 0) {
        await get().removeFromCart(productId);
        return;
      }

      await supabase
        .from('cart')
        .update({ quantity })
        .eq('product_id', productId);

      get().fetchCartItems();
    } catch (error) {
      console.error('Error updating quantity:', error);
    }
  },

  removeFromCart: async (productId: string) => {
    try {
      await supabase
        .from('cart')
        .delete()
        .eq('product_id', productId);

      get().fetchCartItems();
    } catch (error) {
      console.error('Error removing from cart:', error);
    }
  },

  clearCart: async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (user.user) {
        await supabase
          .from('cart')
          .delete()
          .eq('user_id', user.user.id);
      }

      set({ items: [] });
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  },

  getCartTotal: () => {
    const { items } = get();
    return items.reduce((total, item) => {
      if (item.product) {
        return total + (item.product.price * item.quantity);
      }
      return total;
    }, 0);
  }
}));
