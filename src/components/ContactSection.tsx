import React, { useState } from 'react';
import { MapPin, Phone, MessageCircle, Send, Sparkles } from 'lucide-react';
import { 
  BAKERY_NAME, BAKERY_PHONE_NUMBER, BAKERY_PHONE_FORMATTED, 
  BAKERY_ADDRESS, BAKERY_REFERENCE 
} from '../data/desserts';
import { createWhatsAppUrl } from '../utils/whatsapp';

export const ContactSection: React.FC = () => {
  const [quickName, setQuickName] = useState('');
  const [quickMsg, setQuickMsg] = useState('');

  const handleSendQuickInquiry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickName.trim() || !quickMsg.trim()) return;

    const message = `🌸 *Consulta - ${BAKERY_NAME}*\n\n` +
      `👤 *Nombre:* ${quickName}\n` +
      `💬 *Mensaje:* ${quickMsg}\n\n` +
      `¿Podrían confirmarme la disponibilidad? ¡Muchas gracias! 💕`;

    window.open(createWhatsAppUrl(BAKERY_PHONE_NUMBER, message), '_blank', 'noopener,noreferrer');
  };

  return (
    <section id="contacto" className="py-16 sm:py-24 bg-white relative">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-bold uppercase tracking-wider border border-rose-200/80">
            <MapPin className="w-3.5 h-3.5 text-rose-500" />
            <span>Punto de Entrega & Contacto</span>
          </div>

          <h2 className="font-serif-display text-3xl sm:text-4xl lg:text-5xl font-bold text-[#2D1610]">
            Ubicación & Atención
          </h2>

          <p className="text-stone-600 text-sm sm:text-base font-normal">
            Visítanos en nuestro punto de recojo o escríbenos directamente a WhatsApp para coordinar tu entrega a domicilio.
          </p>
        </div>

        {/* Essential Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          
          {/* Card 1: Essential Contact & Location */}
          <div className="bg-[#FAF8F5] rounded-3xl p-6 sm:p-8 border border-stone-200/80 shadow-xs space-y-6">
            <div>
              <h3 className="font-serif-display text-2xl font-bold text-[#2D1610] mb-1">
                {BAKERY_NAME}
              </h3>
              <p className="text-xs text-rose-600 font-semibold">
                Postres que enamoran · Preparados al día
              </p>
            </div>

            <div className="space-y-4 text-xs sm:text-sm text-stone-700">
              <div className="flex items-start gap-3.5 bg-white p-4 rounded-2xl border border-stone-200/80">
                <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-bold text-[#2D1610] block text-sm">Dirección</span>
                  <span className="text-stone-700 font-semibold">{BAKERY_ADDRESS}</span>
                  <span className="text-xs text-rose-600 block mt-0.5 font-medium">Referencia: {BAKERY_REFERENCE}</span>
                </div>
              </div>

              <div className="flex items-start gap-3.5 bg-white p-4 rounded-2xl border border-stone-200/80">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-bold text-[#2D1610] block text-sm">WhatsApp de Pedidos</span>
                  <span className="text-emerald-700 font-extrabold text-base tracking-wide">{BAKERY_PHONE_FORMATTED}</span>
                  <span className="text-xs text-stone-500 block">Atención y pedidos inmediatos</span>
                </div>
              </div>
            </div>

            {/* Direct WhatsApp Call to Action */}
            <a
              href={createWhatsAppUrl(BAKERY_PHONE_NUMBER, `¡Hola ${BAKERY_NAME}! 🌸 Quiero consultar sobre los postres disponibles para hoy.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              <span>Chatear por WhatsApp ({BAKERY_PHONE_FORMATTED})</span>
            </a>
          </div>

          {/* Card 2: Quick Message Direct to WhatsApp */}
          <div className="bg-[#FAF8F5] rounded-3xl p-6 sm:p-8 border border-stone-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-rose-500" />
              <h3 className="font-serif-display text-xl font-bold text-[#2D1610]">
                Escríbenos una Consulta
              </h3>
            </div>

            <p className="text-xs text-stone-600">
              ¿Deseas encargar porciones para un cumpleaños, reunión o consulta de delivery?
            </p>

            <form onSubmit={handleSendQuickInquiry} className="space-y-3.5">
              <div>
                <label className="text-[11px] font-bold text-stone-600 block mb-1">Tu Nombre:</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. María Elena"
                  value={quickName}
                  onChange={(e) => setQuickName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-400 bg-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-stone-600 block mb-1">¿Qué consulta tienes?:</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Ej. ¿Tienen disponible Torta de Tres Leches para enviar a las 4pm?"
                  value={quickMsg}
                  onChange={(e) => setQuickMsg(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-400 bg-white resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-[#2D1610] hover:bg-stone-900 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
              >
                <Send className="w-4 h-4 text-rose-300" />
                <span>Enviar consulta a WhatsApp</span>
              </button>
            </form>
          </div>

        </div>

      </div>
    </section>
  );
};
