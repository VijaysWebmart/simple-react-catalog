
import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const sliderImages = [
  {
    url: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=400&fit=crop",
    title: "Summer Collection",
    subtitle: "Discover the latest trends"
  },
  {
    url: "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=1200&h=400&fit=crop",
    title: "Best Deals",
    subtitle: "Up to 50% off on selected items"
  },
  {
    url: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=1200&h=400&fit=crop",
    title: "New Arrivals",
    subtitle: "Fresh styles just landed"
  }
];

const ImageSlider = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % sliderImages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % sliderImages.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + sliderImages.length) % sliderImages.length);
  };

  return (
    <div className="relative h-64 md:h-96 overflow-hidden">
      <div 
        className="flex transition-transform duration-500 ease-in-out h-full"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {sliderImages.map((image, index) => (
          <div key={index} className="w-full h-full flex-shrink-0 relative">
            <img
              src={image.url}
              alt={image.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
              <div className="text-center text-white">
                <h2 className="text-3xl md:text-5xl font-bold mb-2">{image.title}</h2>
                <p className="text-lg md:text-xl">{image.subtitle}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 transition-all"
      >
        <ChevronLeft className="w-6 h-6 text-gray-800" />
      </button>
      
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 transition-all"
      >
        <ChevronRight className="w-6 h-6 text-gray-800" />
      </button>
      
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
        {sliderImages.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-3 h-3 rounded-full transition-all ${
              index === currentSlide ? 'bg-white' : 'bg-white bg-opacity-50'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default ImageSlider;
