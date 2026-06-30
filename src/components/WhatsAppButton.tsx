import React from 'react';
import { MessageCircle } from 'lucide-react';

// Update this number (international format, no + or spaces) or store it in store_settings later.
const WHATSAPP_NUMBER = '919999999999';
const DEFAULT_MESSAGE = 'Hello Noorvi, I have a question about your products.';

const WhatsAppButton = () => {
  const href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(DEFAULT_MESSAGE)}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-5 right-5 z-50 flex items-center justify-center w-14 h-14 rounded-full bg-[#25D366] text-white shadow-lg hover:scale-105 active:scale-95 transition-transform"
    >
      <MessageCircle className="w-7 h-7" fill="currentColor" stroke="white" strokeWidth={1.5} />
    </a>
  );
};

export default WhatsAppButton;
