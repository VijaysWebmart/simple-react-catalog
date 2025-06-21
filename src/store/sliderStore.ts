
import { create } from 'zustand';
import { supabase } from '../integrations/supabase/client';

interface SliderImage {
  id: string;
  title: string;
  subtitle: string;
  image_url: string;
  display_order: number;
  is_active: boolean;
  created_at?: string;
}

interface SliderStore {
  sliderImages: SliderImage[];
  loading: boolean;
  fetchSliderImages: () => Promise<void>;
  addSliderImage: (image: Omit<SliderImage, 'id' | 'created_at'>) => Promise<void>;
  updateSliderImage: (image: SliderImage) => Promise<void>;
  deleteSliderImage: (id: string) => Promise<void>;
  uploadSliderImage: (file: File) => Promise<string>;
}

export const useSliderStore = create<SliderStore>((set, get) => ({
  sliderImages: [],
  loading: false,

  fetchSliderImages: async () => {
    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from('slider_images')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) {
        console.error('Error fetching slider images:', error);
        return;
      }

      set({ sliderImages: data || [] });
    } catch (error) {
      console.error('Error fetching slider images:', error);
    } finally {
      set({ loading: false });
    }
  },

  addSliderImage: async (imageData) => {
    try {
      const { data, error } = await supabase
        .from('slider_images')
        .insert([imageData])
        .select()
        .single();

      if (error) {
        console.error('Error adding slider image:', error);
        return;
      }

      set((state) => ({
        sliderImages: [...state.sliderImages, data].sort((a, b) => a.display_order - b.display_order)
      }));
    } catch (error) {
      console.error('Error adding slider image:', error);
    }
  },

  updateSliderImage: async (updatedImage) => {
    try {
      const { data, error } = await supabase
        .from('slider_images')
        .update(updatedImage)
        .eq('id', updatedImage.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating slider image:', error);
        return;
      }

      set((state) => ({
        sliderImages: state.sliderImages.map((image) =>
          image.id === updatedImage.id ? data : image
        ).sort((a, b) => a.display_order - b.display_order)
      }));
    } catch (error) {
      console.error('Error updating slider image:', error);
    }
  },

  deleteSliderImage: async (id) => {
    try {
      const { error } = await supabase
        .from('slider_images')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting slider image:', error);
        return;
      }

      set((state) => ({
        sliderImages: state.sliderImages.filter((image) => image.id !== id)
      }));
    } catch (error) {
      console.error('Error deleting slider image:', error);
    }
  },

  uploadSliderImage: async (file: File) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
      const filePath = `slider/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('slider-images')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Error uploading slider image:', uploadError);
        throw uploadError;
      }

      const { data } = supabase.storage
        .from('slider-images')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading slider image:', error);
      throw error;
    }
  }
}));
