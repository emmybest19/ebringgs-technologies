import { MessageCircle } from 'lucide-react';

const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || '2341234567890';
const WHATSAPP_MESSAGE = encodeURIComponent('Hello E-Bringgs! I would like to inquire about your services.');

export default function WhatsAppButton() {
  return (
    <a
      href={`https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE}`}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all hover:scale-110 group"
    >
      <MessageCircle size={26} className="text-white" />
      <span className="absolute right-full mr-3 px-3 py-1.5 bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm font-medium rounded-lg shadow-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
        Chat with us
      </span>
    </a>
  );
}
