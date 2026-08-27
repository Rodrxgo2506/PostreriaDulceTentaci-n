import React from 'react';
import { Sparkles, Heart, MessageCircle, ShieldCheck } from 'lucide-react';
import { StoreConfig } from '../types';
import { DEFAULT_STORE_CONFIG } from '../utils/storeConfigStorage';
import { createWhatsAppUrl } from '../utils/whatsapp';

interface FooterProps {
  storeConfig?: StoreConfig;
}

export const Footer: React.FC<FooterProps> = ({
  storeConfig = DEFAULT_STORE_CONFIG
}) => {
  const bakeryName = storeConfig.bakeryName || DEFAULT_STORE_CONFIG.bakeryName;
  const phoneFormatted = storeConfig.phoneFormatted || DEFAULT_STORE_CONFIG.phoneFormatted;
  const phoneNumber = storeConfig.phoneNumber || DEFAULT_STORE_CONFIG.phoneNumber;
  const address = storeConfig.address || DEFAULT_STORE_CONFIG.address;
  const reference = storeConfig.reference || DEFAULT_STORE_CONFIG.reference;

  return (
    <footer className="bg-[#1E0F0A] text-stone-300 pt-16 pb-12 border-t border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Top 3-column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 pb-12 border-b border-stone-800">

          {/* Col 1: Brand Info (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-600 flex items-center justify-center text-white shadow-xs">
                <Sparkles className="w-5 h-5 text-rose-100" />
              </div>
              <span className="font-serif-display text-2xl font-bold text-white tracking-wide">
                {bakeryName}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-stone-400 leading-relaxed max-w-sm font-light">
              Postres caseros de alta calidad preparados a diario con dedicación artesanal.
              Disfruta de nuestra Torta Tres Leches, Crema Volteada y Cheesecake de Maracuyá por solo <strong>S/ 10.00</strong>. Delivery GRATIS a partir de 2 unidades.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <a
                href={createWhatsAppUrl(phoneNumber, `¡Hola ${bakeryName}! 🌸`)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs"
                title="WhatsApp"
              >
                <MessageCircle className="w-4 h-4 fill-white" />
                <span>Escríbenos al WhatsApp</span>
              </a>
            </div>
          </div>

          {/* Col 2: Navigation Links (3 cols) */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-rose-400 font-sans">
              Nuestra Carta
            </h4>
            <ul className="space-y-2 text-xs text-stone-400">
              <li><a href="#catalogo" className="hover:text-rose-300 transition-colors">• Torta de Tres Leches</a></li>
              <li><a href="#catalogo" className="hover:text-rose-300 transition-colors">• Crema Volteada</a></li>
              <li><a href="#catalogo" className="hover:text-rose-300 transition-colors">• Cheesecake de Maracuyá</a></li>
              <li className="pt-2 text-emerald-400 font-semibold">🛵 Delivery Gratis (2+ unidades)</li>
            </ul>
          </div>

          {/* Col 3: Delivery and Location (4 cols) */}
          <div className="lg:col-span-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-rose-400 font-sans flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-rose-500" />
              <span>Ubicación & Contacto</span>
            </h4>
            <p className="text-xs text-stone-400 leading-relaxed">
              📍 {address} <br />
              <span className="text-rose-300">({reference})</span> <br />
              📱 WhatsApp: <strong className="text-white">{phoneFormatted}</strong>
            </p>

            <div className="flex flex-wrap gap-2 pt-1 text-[10px] font-mono text-stone-300">
              <span className="bg-stone-800 px-2.5 py-1 rounded border border-stone-700 font-bold text-purple-300">YAPE</span>
              <span className="bg-stone-800 px-2.5 py-1 rounded border border-stone-700 font-bold text-sky-300">PLIN</span>
              <span className="bg-stone-800 px-2.5 py-1 rounded border border-stone-700">TARJETAS</span>
              <span className="bg-stone-800 px-2.5 py-1 rounded border border-stone-700">CONTRA ENTREGA</span>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 gap-4">
          <p>© {new Date().getFullYear()} {bakeryName}. Todos los derechos reservados.</p>
          <p className="flex items-center gap-1 text-stone-400">
            Hecho con <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> para endulzar cada momento.
          </p>
        </div>

      </div>
    </footer>
  );
};
