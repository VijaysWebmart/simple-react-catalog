
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useProductStore } from '../store/productStore';
import { supabase } from '../integrations/supabase/client';
import ImageUpload from './ImageUpload';

interface ProductFormProps {
  product?: any;
  onClose: () => void;
}

const ProductForm = ({ product, onClose }: ProductFormProps) => {
  const { addProduct, updateProduct, uploadProductImages } = useProductStore();
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    name: product?.name || '',
    price: product?.price || '',
    category: product?.category || '',
    description: product?.description || '',
    images: product?.images || [],
    sku: product?.sku || '',
    stock_quantity: product?.stock_quantity || 0,
    is_active: product?.is_active !== undefined ? product.is_active : true,
    is_featured: product?.is_featured !== undefined ? product.is_featured : false,
    variants: product?.variants || []
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const productData = {
        name: formData.name,
        price: parseFloat(formData.price as string),
        category: formData.category,
        description: formData.description,
        images: formData.images,
        sku: formData.sku || null,
        stock_quantity: parseInt(formData.stock_quantity as string) || 0,
        is_active: formData.is_active,
        is_featured: formData.is_featured,
        variants: formData.variants
      };

      if (product) {
        await updateProduct({
          ...productData,
          id: product.id
        });
      } else {
        await addProduct(productData);
      }
      
      onClose();
    } catch (error) {
      console.error('Error saving product:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    });
  };

  const handleImagesChange = (images: string[]) => {
    setFormData({
      ...formData,
      images
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">
            {product ? 'Edit Product' : 'Add Product'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SKU
              </label>
              <input
                type="text"
                name="sku"
                value={formData.sku}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Product SKU"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price (₹)
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stock Quantity
              </label>
              <input
                type="number"
                name="stock_quantity"
                value={formData.stock_quantity}
                onChange={handleChange}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select a category</option>
              {categories.map((category: any) => (
                <option key={category.id} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center space-x-6">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
                className="mr-2"
              />
              <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                Active
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_featured"
                name="is_featured"
                checked={formData.is_featured}
                onChange={handleChange}
                className="mr-2"
              />
              <label htmlFor="is_featured" className="text-sm font-medium text-gray-700">
                Featured
              </label>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product Images
            </label>
            <ImageUpload
              images={formData.images}
              onImagesChange={handleImagesChange}
              onUpload={uploadProductImages}
              maxFiles={5}
            />
          </div>
          
          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-2 px-4 rounded-lg transition-colors"
            >
              {isSubmitting ? 'Saving...' : (product ? 'Update Product' : 'Add Product')}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 bg-gray-300 hover:bg-gray-400 disabled:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductForm;
