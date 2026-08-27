import React from 'react';
import { Sparkles, MessageCircle, Heart, MapPin, CheckCircle2, ChevronRight, ArrowRight, Star } from 'lucide-react';
import { StoreConfig, HeroShowcaseCard } from '../types';
import { DEFAULT_STORE_CONFIG, DEFAULT_HERO_CARDS } from '../utils/storeConfigStorage';
import { createWhatsAppUrl } from '../utils/whatsapp';

interface HeroProps {
  onExploreMenu: () => void;
  onOpenQuickCalculator: () => void;
  storeConfig?: StoreConfig;
}

export const Hero: React.FC<HeroProps> = ({
  onExploreMenu,
  onOpenQuickCalculator,
  storeConfig = DEFAULT_STORE_CONFIG
}) => {
  const bakeryName = storeConfig.bakeryName || DEFAULT_STORE_CONFIG.bakeryName;
  const bakerySlogan = storeConfig.bakerySlogan || DEFAULT_STORE_CONFIG.bakerySlogan;
  const bakerySubtitle = storeConfig.bakerySubtitle || DEFAULT_STORE_CONFIG.bakerySubtitle;
  const heroDescription = storeConfig.heroDescription || `${bakerySlogan} · Postres caseros preparados a diario con la más fina dedicación`;
  const phoneFormatted = storeConfig.phoneFormatted || DEFAULT_STORE_CONFIG.phoneFormatted;
  const phoneNumber = storeConfig.phoneNumber || DEFAULT_STORE_CONFIG.phoneNumber;
  const address = storeConfig.address || DEFAULT_STORE_CONFIG.address;
  const reference = storeConfig.reference || DEFAULT_STORE_CONFIG.reference;
  const deliveryPromoText = storeConfig.deliveryPromoText || 'A partir de 2 unidades';

  const heroCards: HeroShowcaseCard[] = Array.isArray(storeConfig.heroCards) && storeConfig.heroCards.length > 0
    ? storeConfig.heroCards
    : DEFAULT_HERO_CARDS;

  const handleQuickWhatsApp = (dessertName: string, price: number) => {
    const msg = `¡Hola ${bakeryName}! 🍰 Deseo pedir ${dessertName} (S/ ${price.toFixed(2)}). ¿Tienen disponible para entrega hoy?`;
    window.open(createWhatsAppUrl(phoneNumber, msg), '_blank', 'noopener,noreferrer');
  };

  const getAccentClasses = (color?: string) => {
    switch (color) {
      case 'amber':
        return {
          border: 'hover:border-amber-300',
          title: 'group-hover:text-amber-700',
          priceSymbol: 'text-amber-700',
        };
      case 'purple':
        return {
          border: 'hover:border-purple-300',
          title: 'group-hover:text-purple-700',
          priceSymbol: 'text-purple-700',
        };
      case 'emerald':
        return {
          border: 'hover:border-emerald-300',
          title: 'group-hover:text-emerald-700',
          priceSymbol: 'text-emerald-700',
        };
      case 'pink':
        return {
          border: 'hover:border-pink-300',
          title: 'group-hover:text-pink-600',
          priceSymbol: 'text-pink-600',
        };
      case 'rose':
      default:
        return {
          border: 'hover:border-rose-300',
          title: 'group-hover:text-rose-600',
          priceSymbol: 'text-rose-600',
        };
    }
  };

  const getGridColsClass = (count: number) => {
    if (count === 1) return 'grid-cols-1 max-w-md mx-auto';
    if (count === 2) return 'grid-cols-1 md:grid-cols-2 max-w-3xl mx-auto';
    if (count === 3) return 'grid-cols-1 md:grid-cols-3';
    return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
  };

  return (
    <section id="hero-section" className="relative overflow-hidden pt-6 pb-16 lg:pt-10 lg:pb-20 bg-[#FCFAF8]">

      {/* Background Soft Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-rose-100/50 via-pink-50/20 to-transparent pointer-events-none rounded-full blur-3xl -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Main Boutique Hero Card Container */}
        <div className="bg-white rounded-3xl sm:rounded-[36px] border border-rose-100/80 p-6 sm:p-10 lg:p-12 shadow-xl shadow-rose-900/5 relative overflow-hidden">

          {/* Header Area */}
          <div className="text-center space-y-4 max-w-3xl mx-auto mb-10">

            {/* Top Pill with Subtitle */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-50 border border-rose-200/80 text-rose-700 text-xs sm:text-sm font-semibold shadow-xs">
              <span className="text-rose-500">♥</span>
              <span>{bakerySubtitle}</span>
              <span className="text-rose-500">♥</span>
            </div>

            {/* Brand Title with elegant serif font */}
            <div className="space-y-2">
              <h1 className="font-serif-display text-4xl sm:text-6xl lg:text-7xl font-bold text-[#2D1610] tracking-tight">
                {bakeryName}
              </h1>

              <p className="text-sm sm:text-base lg:text-lg text-stone-600 font-medium max-w-xl mx-auto">
                {heroDescription}
              </p>
            </div>

          </div>

          {/* Dynamic Showcase Desserts Grid */}
          <div className={`grid gap-6 lg:gap-8 my-8 ${getGridColsClass(heroCards.length)}`}>
            {heroCards.map((card) => {
              const styling = getAccentClasses(card.accentColor);
              const btnLabel = card.buttonText || `Pedir ${card.name.replace(/^(Torta|Crema|Cheesecake|Pie|Tarta)\s+(de\s+)?/i, '')}`;

              return (
                <div
                  key={card.id}
                  className={`bg-[#FAF8F5] rounded-3xl p-5 border border-stone-200/60 shadow-sm hover:shadow-xl ${styling.border} transition-all duration-300 flex flex-col justify-between group`}
                >
                  <div>
                    {/* Photo container */}
                    <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden mb-4 bg-stone-100">
                      <img
                        src={card.image}
                        alt={card.name}
                        className="w-full h-full object-cover group-hover:scale-106 transition-transform duration-500"
                        loading="lazy"
                      />
                      <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-[11px] font-bold text-stone-800 shadow-xs flex items-center gap-1">
                        <Star className="w-3 h-3 text-amber-500 fill-amber-400" />
                        <span>{(card.rating || 5.0).toFixed(1)}</span>
                      </div>
                    </div>

                    <div className="space-y-1.5 mb-4">
                      <h3 className={`font-serif-display text-xl sm:text-2xl font-bold text-[#2D1610] ${styling.title} transition-colors line-clamp-1`}>
                        {card.name}
                      </h3>
                      <p className="text-xs text-stone-600 leading-relaxed line-clamp-2">
                        {card.description}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-stone-200/60 space-y-3">
                    <div className="flex items-baseline justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                        {card.portion || 'Porción Generosa'}
                      </span>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl font-black text-[#2D1610] font-sans">
                          <span className={`text-base font-bold ${styling.priceSymbol} mr-0.5`}>S/</span>
                          {card.price.toFixed(2)}
                        </span>
                        {card.originalPrice && card.originalPrice > card.price && (
                          <span className="text-xs text-stone-600 line-through">
                            S/ {card.originalPrice.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleQuickWhatsApp(card.name, card.price)}
                      className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
                    >
                      <MessageCircle className="w-4 h-4 fill-white shrink-0" />
                      <span className="truncate">{btnLabel}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Delivery & WhatsApp Info Callout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#F8F5F1] rounded-2xl p-4 sm:p-6 border border-stone-200/80 mb-6">

            {/* Delivery Promo */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-600 flex items-center justify-center text-2xl text-white shadow-sm shrink-0">
                🛵
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm sm:text-base font-black text-[#2D1610] uppercase tracking-wide">
                    Delivery Gratis
                  </span>
                  <span className="bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {deliveryPromoText}
                  </span>
                </div>
                <p className="text-xs text-stone-600 font-medium">
                  Directo y puntual a tu casa, oficina o evento
                </p>
              </div>
            </div>

            {/* WhatsApp Pedidos directos */}
            <a
              href={createWhatsAppUrl(phoneNumber, `¡Hola ${bakeryName}! 🌸 Quiero hacer un pedido.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between bg-emerald-600 hover:bg-emerald-700 text-white p-3.5 sm:p-4 rounded-2xl shadow-sm transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white">
                  <MessageCircle className="w-5 h-5 fill-white" />
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-emerald-100 block">
                    WhatsApp de Pedidos
                  </span>
                  <span className="text-base sm:text-lg font-black tracking-wide">
                    {phoneFormatted}
                  </span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-white/80 group-hover:translate-x-1 transition-transform" />
            </a>

          </div>

          {/* Location Bar */}
          <div className="bg-[#2D1610] text-white rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left shadow-md">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-full bg-rose-600 flex items-center justify-center text-white shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-serif-display text-lg sm:text-xl font-bold uppercase tracking-wide text-rose-100">
                  {address}
                </h4>
                <p className="text-xs text-rose-300 font-medium">
                  Referencia: {reference}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={onOpenQuickCalculator}
                className="px-5 py-2.5 rounded-full bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>🛵 Armar Pedido Rápido</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
