import React, { useState, useEffect } from 'react';
import { MessageCircle, X, Send, Sparkles } from 'lucide-react';
import { StoreConfig } from '../types';
import { DEFAULT_STORE_CONFIG } from '../utils/storeConfigStorage';
import { createWhatsAppUrl } from '../utils/whatsapp';

interface FloatingWhatsAppProps {
  storeConfig?: StoreConfig;
}

export const FloatingWhatsApp: React.FC<FloatingWhatsAppProps> = ({
  storeConfig = DEFAULT_STORE_CONFIG
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [showNotification, setShowNotification] = useState(false);
  const [isKeyboardActive, setIsKeyboardActive] = useState(false);

  const bakeryName = storeConfig.bakeryName || DEFAULT_STORE_CONFIG.bakeryName;
  const phoneNumber = storeConfig.phoneNumber || DEFAULT_STORE_CONFIG.phoneNumber;

  // Detect virtual keyboard on mobile devices to move button upwards
  useEffect(() => {
    const handleViewportResize = () => {
      if (window.visualViewport) {
        const isKeyboard = window.innerHeight - window.visualViewport.height > 150;
        setIsKeyboardActive(isKeyboard);
      }
    };

    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) {
        if (window.innerWidth < 768) {
          setIsKeyboardActive(true);
        }
      }
    };

    const handleFocusOut = () => {
      setTimeout(() => {
        if (window.visualViewport) {
          const isKeyboard = window.innerHeight - window.visualViewport.height > 150;
          setIsKeyboardActive(isKeyboard);
        } else {
          setIsKeyboardActive(false);
        }
      }, 100);
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportResize);
      window.visualViewport.addEventListener('scroll', handleViewportResize);
    }
    window.addEventListener('focusin', handleFocusIn);
    window.addEventListener('focusout', handleFocusOut);

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleViewportResize);
        window.visualViewport.removeEventListener('scroll', handleViewportResize);
      }
      window.removeEventListener('focusin', handleFocusIn);
      window.removeEventListener('focusout', handleFocusOut);
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowNotification(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    const finalMsg = message.trim() || `¡Hola ${bakeryName}! 🍰 Quisiera hacer un pedido de los postres en stock.`;
    window.open(createWhatsAppUrl(phoneNumber, finalMsg), '_blank', 'noopener,noreferrer');
    setIsOpen(false);
    setMessage('');
  };

  return (
    <div
      className={`fixed right-4 sm:right-5 z-40 flex flex-col items-end transition-all duration-300 ease-out ${isKeyboardActive
          ? 'bottom-24 sm:bottom-5 -translate-y-6 sm:translate-y-0 opacity-90 hover:opacity-100'
          : 'bottom-5 translate-y-0 opacity-100'
        }`}
    >
      {/* Mini Chat Popover */}
      {isOpen && (
        <div className="mb-3 w-80 sm:w-88 bg-white rounded-3xl shadow-2xl border border-rose-100 overflow-hidden animate-fadeIn">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-4 text-white flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-lg shadow-inner">
                  🍰
                </div>
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-300 border-2 border-emerald-700 rounded-full animate-pulse" />
              </div>
              <div>
                <h4 className="font-serif-display font-bold text-base leading-tight flex items-center gap-1.5">
                  <span>{bakeryName}</span>
                  <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                </h4>
                <p className="text-[11px] text-emerald-100 font-medium">En línea · Atención y Pedidos Inmediatos</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-full hover:bg-emerald-700/80 text-white/90 hover:text-white transition-colors"
              aria-label="Cerrar chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Chat Message Bubble */}
          <div className="p-4 bg-[#F8FAFC] space-y-3">
            <div className="bg-white p-3.5 rounded-2xl rounded-tl-none shadow-sm text-xs text-stone-800 space-y-1.5 border border-stone-100">
              <p className="font-bold text-emerald-700 flex items-center gap-1">
                <span>¡Hola! Bienvenidos a {bakeryName}</span>
                <span>💖</span>
              </p>
              <p className="text-stone-600 leading-relaxed">
                ¿Deseas pedir tu <strong>Torta de Tres Leches</strong>, <strong>Crema Volteada</strong> o <strong>Cheesecake de Maracuyá</strong> (S/ 10 c/u)?
              </p>
              <p className="text-[11px] text-rose-600 font-semibold">
                🛵 Recuerda: ¡Delivery GRATIS desde 2 unidades!
              </p>
              <span className="text-[10px] text-stone-400 block text-right pt-1">Ahora mismo</span>
            </div>
          </div>

          {/* Input Form */}
          <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-stone-100 flex gap-2">
            <input
              type="text"
              placeholder="Escribe tu consulta o pedido..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="flex-1 px-3.5 py-2.5 text-xs rounded-xl border border-rose-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-stone-50/50 text-stone-800"
              autoFocus
            />
            <button
              type="submit"
              className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-200 transition-colors flex items-center justify-center cursor-pointer"
              title="Enviar por WhatsApp"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* Floating Notification Tooltip when closed */}
      {!isOpen && showNotification && (
        <div className="mb-2 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-xl border border-rose-200 text-xs font-bold text-stone-800 flex items-center gap-2 animate-bounce-gentle">
          <span className="text-rose-500">💬</span>
          <span>¿Pedimos un postre por WhatsApp?</span>
          <button
            onClick={() => setShowNotification(false)}
            className="text-stone-400 hover:text-stone-600 text-xs ml-1"
          >
            ×
          </button>
        </div>
      )}

      {/* Main Floating WhatsApp Bubble */}
      <button
        id="btn-floating-whatsapp"
        onClick={() => {
          setIsOpen(!isOpen);
          setShowNotification(false);
        }}
        className="w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center shadow-xl shadow-emerald-400/40 hover:shadow-emerald-400/60 transition-all transform hover:scale-110 active:scale-95 cursor-pointer relative"
        aria-label={`Abrir chat de WhatsApp ${bakeryName}`}
      >
        <MessageCircle className="w-7 h-7 fill-white" />
        <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-rose-500 border-2 border-white rounded-full" />
      </button>
    </div>
  );
};
