
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  description: string;
  images: string[];
}

interface ProductStore {
  products: Product[];
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (id: number) => void;
}

const defaultProducts: Product[] = [
  {
    id: 1,
    name: "Wireless Bluetooth Headphones",
    price: 2999,
    category: "Electronics",
    description: "Premium quality wireless headphones with noise cancellation and superior sound quality. Perfect for music lovers and professionals.",
    images: [
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop",
      "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=500&h=500&fit=crop"
    ]
  },
  {
    id: 2,
    name: "Smart Fitness Watch",
    price: 4999,
    category: "Wearables",
    description: "Advanced fitness tracker with heart rate monitoring, GPS, and waterproof design. Track your health and fitness goals effortlessly.",
    images: [
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&h=500&fit=crop",
      "https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=500&h=500&fit=crop"
    ]
  },
  {
    id: 3,
    name: "Portable Phone Charger",
    price: 1499,
    category: "Accessories",
    description: "High-capacity power bank with fast charging technology. Never run out of battery on the go with this reliable charging solution.",
    images: [
      "https://images.unsplash.com/photo-1609592806596-17b9ad05d4eb?w=500&h=500&fit=crop"
    ]
  },
  {
    id: 4,
    name: "Ergonomic Office Chair",
    price: 8999,
    category: "Furniture",
    description: "Comfortable ergonomic office chair with lumbar support and adjustable height. Perfect for long working hours and maintaining good posture.",
    images: [
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500&h=500&fit=crop"
    ]
  },
  {
    id: 5,
    name: "Ceramic Coffee Mug Set",
    price: 799,
    category: "Home & Kitchen",
    description: "Beautiful set of 4 ceramic coffee mugs with elegant design. Perfect for your morning coffee or as a gift for coffee enthusiasts.",
    images: [
      "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=500&h=500&fit=crop"
    ]
  },
  {
    id: 6,
    name: "LED Desk Lamp",
    price: 1999,
    category: "Lighting",
    description: "Modern LED desk lamp with adjustable brightness and color temperature. Perfect for reading, studying, and working.",
    images: [
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&h=500&fit=crop"
    ]
  }
];

export const useProductStore = create<ProductStore>()(
  persist(
    (set) => ({
      products: defaultProducts,
      addProduct: (product) =>
        set((state) => ({
          products: [...state.products, { ...product, id: Date.now() }],
        })),
      updateProduct: (updatedProduct) =>
        set((state) => ({
          products: state.products.map((product) =>
            product.id === updatedProduct.id ? updatedProduct : product
          ),
        })),
      deleteProduct: (id) =>
        set((state) => ({
          products: state.products.filter((product) => product.id !== id),
        })),
    }),
    {
      name: 'product-store',
    }
  )
);
