import React, { useState, useEffect } from 'react';
import { Dessert } from '../types';
import { 
  MessageCircle, ShoppingBag, Plus, Minus, 
  CheckCircle2, MapPin, CreditCard, Send, ArrowRight, Store, Truck, AlertTriangle
} from 'lucide-react';
import { 
  BAKERY_NAME, BAKERY_PHONE_NUMBER, BAKERY_PHONE_FORMATTED, 
  DELIVERY_PROMO_THRESHOLD, BAKERY_ADDRESS, BAKERY_REFERENCE 
} from '../data/desserts';
import { createWhatsAppUrl } from '../utils/whatsapp';

interface QuickOrderCalculatorProps {
  desserts: Dessert[];
  onAddToCartMultiple: (items: { dessert: Dessert; quantity: number }[]) => void;
  onOpenPaymentGatewayDirect?: (
    items: { dessert: Dessert; quantity: number }[],
    customerInfo: any,
    deliveryFee: number
  ) => void;
}

export const QuickOrderCalculator: React.FC<QuickOrderCalculatorProps> = ({
  desserts,
  onAddToCartMultiple,
  onOpenPaymentGatewayDirect,
}) => {
  // Quantities for each stock item
  const [quantities, setQuantities] = useState<Record<string, number>>({
    'torta-tres-leches': 1,
    'crema-volteada': 1,
    'cheesecake-maracuya': 0,
  });

  const [customerName, setCustomerName] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryType, setDeliveryType] = useState<'delivery' | 'pickup'>('delivery');
  const [customerPhone, setCustomerPhone] = useState('');
  const [notes, setNotes] = useState('');

  const updateQuantity = (id: string, delta: number) => {
    setQuantities((prev) => {
      const current = prev[id] || 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [id]: next };
    });
  };

  // Calculations
  const selectedItems = desserts
    .map((d) => ({ dessert: d, quantity: quantities[d.id] || 0 }))
    .filter((item) => item.quantity > 0);

  const totalQuantity = selectedItems.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = selectedItems.reduce((acc, item) => acc + item.dessert.price * item.quantity, 0);
  
  // Rule: If totalQuantity === 1, modality is strictly Recojo en Tienda (no delivery charge).
  // If totalQuantity >= 2, customer can choose Free Delivery or Pickup.
  const activeDeliveryType = totalQuantity === 1 ? 'pickup' : deliveryType;
  const deliveryFee = 0; // Never charge delivery fee (1 is pickup, 2+ is free delivery)
  const grandTotal = subtotal;

  const handleSendWhatsAppOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (totalQuantity === 0) {
      alert('Por favor selecciona al menos 1 postre.');
      return;
    }

    if (!customerName.trim() || !customerPhone.trim()) {
      alert('⚠️ Por favor completa tu Nombre y Teléfono / WhatsApp antes de enviar tu pedido.');
      return;
    }

    if (totalQuantity >= 2 && activeDeliveryType === 'delivery' && !deliveryAddress.trim()) {
      alert('⚠️ Por favor ingresa tu Dirección de Entrega para el Delivery Gratis.');
      return;
    }

    let message = `🌸 *¡Hola ${BAKERY_NAME}! Deseo hacer un pedido:* 🍰\n\n`;
    message += `📋 *DETALLE DEL PEDIDO:*\n`;

    selectedItems.forEach((item) => {
      message += `• ${item.quantity}x ${item.dessert.name} — S/ ${(item.dessert.price * item.quantity).toFixed(2)}\n`;
    });

    message += `\n🍰 *Total Unidades:* ${totalQuantity}`;
    message += `\n💰 *Subtotal:* S/ ${subtotal.toFixed(2)}`;

    if (totalQuantity === 1) {
      message += `\n🏪 *Modalidad:* Recojo en tienda (${BAKERY_ADDRESS} - ${BAKERY_REFERENCE})`;
      message += `\n🛵 *Costo de Envío:* S/ 0.00 (Recojo en local)`;
    } else if (activeDeliveryType === 'delivery') {
      message += `\n🛵 *Modalidad:* ¡DELIVERY GRATIS a Domicilio! 🎉 (Promo 2+ unidades)`;
      message += `\n📍 *Dirección:* ${deliveryAddress}`;
      message += `\n🛵 *Costo de Envío:* S/ 0.00 (¡GRATIS!)`;
    } else {
      message += `\n🏪 *Modalidad:* Recojo en tienda (${BAKERY_ADDRESS} - ${BAKERY_REFERENCE})`;
    }

    message += `\n💵 *TOTAL A PAGAR:* S/ ${grandTotal.toFixed(2)}\n\n`;

    message += `👤 *DATOS DEL CLIENTE:*\n`;
    message += `• Nombre: ${customerName}\n`;
    message += `• WhatsApp: ${customerPhone}\n`;
    if (notes.trim()) message += `• Indicaciones / Dedicatoria: ${notes.trim()}\n`;

    message += `\n¿Me confirman para coordinar? ¡Muchas gracias! 💕`;

    window.open(createWhatsAppUrl(BAKERY_PHONE_NUMBER, message), '_blank', 'noopener,noreferrer');
  };

  const handleAddAllToCart = () => {
    if (totalQuantity === 0) return;
    onAddToCartMultiple(selectedItems);
  };

  return (
    <section id="calculadora-pedido" className="py-16 sm:py-24 bg-[#FAF8F5] relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-bold uppercase tracking-wider border border-rose-200/80">
            <span>🛵</span>
            <span>Calculadora de Pedido</span>
          </div>

          <h2 className="font-serif-display text-3xl sm:text-4xl lg:text-5xl font-bold text-[#2D1610]">
            Arma tu Pedido en Segundos
          </h2>

          <p className="text-stone-600 text-sm sm:text-base max-w-xl mx-auto">
            Porciones generosas a <strong>S/ 10 cada una</strong>. Si pides 1 unidad, recógelo en tienda; si pides <strong>2 o más</strong>, ¡te lo llevamos con <strong>DELIVERY GRATIS</strong>!
          </p>
        </div>

        {/* Main 2-Column Box */}
        <div className="bg-white rounded-3xl sm:rounded-[36px] border border-stone-200/80 shadow-xl shadow-stone-900/5 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          
          {/* Left Column: Product Pickers (7 Cols) */}
          <div className="lg:col-span-7 p-6 sm:p-8 space-y-6 border-b lg:border-b-0 lg:border-r border-stone-200/60">
            <h3 className="font-serif-display text-xl font-bold text-[#2D1610] flex items-center gap-2">
              <span>1. Selecciona tus postres:</span>
            </h3>

            <div className="space-y-4">
              {desserts.map((dessert) => {
                const qty = quantities[dessert.id] || 0;
                return (
                  <div
                    key={dessert.id}
                    className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                      qty > 0 ? 'border-rose-300 bg-rose-50/30' : 'border-stone-200/80 bg-white hover:border-stone-300'
                    }`}
                  >
                    {/* Image & Title */}
                    <div className="flex items-center gap-3.5">
                      <img
                        src={dessert.image}
                        alt={dessert.name}
                        className="w-16 h-16 rounded-xl object-cover border border-stone-200 shrink-0"
                      />
                      <div>
                        <h4 className="font-serif-display font-bold text-[#2D1610] text-sm sm:text-base leading-tight">
                          {dessert.name}
                        </h4>
                        <div className="flex items-baseline gap-1.5 mt-1">
                          <span className="text-sm font-extrabold text-[#2D1610]">
                            <span className="text-rose-600 mr-0.5">S/</span>{dessert.price.toFixed(2)}
                          </span>
                          <span className="text-[11px] text-stone-600 line-through">
                            S/ 12.00
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Stepper Controls */}
                    <div className="flex items-center gap-2 bg-stone-50 rounded-xl border border-stone-200 p-1 shadow-xs shrink-0">
                      <button
                        type="button"
                        onClick={() => updateQuantity(dessert.id, -1)}
                        disabled={qty <= 0}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-600 hover:bg-rose-100 hover:text-rose-700 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
                        aria-label="Restar uno"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-extrabold text-sm sm:text-base text-stone-900">
                        {qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(dessert.id, 1)}
                        className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center hover:bg-rose-700 transition-colors shadow-xs cursor-pointer"
                        aria-label="Sumar uno"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Delivery mode selection */}
            <div className="pt-2">
              <label className="text-xs font-bold text-stone-700 block mb-2">
                2. Modalidad de entrega:
              </label>

              {totalQuantity === 1 ? (
                /* Notice for 1 unit: pickup only */
                <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs space-y-2">
                  <div className="flex items-center gap-2 font-bold text-amber-950">
                    <Store className="w-4 h-4 text-amber-700" />
                    <span>Modalidad para 1 postre: Recojo en Tienda (Sin costo de envío)</span>
                  </div>
                  <p className="text-amber-800 text-[11px] leading-relaxed">
                    📍 <strong>Ubicación de recojo:</strong> {BAKERY_ADDRESS} ({BAKERY_REFERENCE}).
                  </p>
                  <p className="text-[11px] text-rose-700 font-semibold bg-white/70 p-2 rounded-xl border border-amber-200/50">
                    💡 ¡Agrega <strong>1 postre más (2 o más unidades)</strong> para obtener <strong>DELIVERY GRATIS</strong> hasta tu puerta!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setDeliveryType('delivery')}
                    className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      deliveryType === 'delivery'
                        ? 'border-rose-500 bg-rose-50 text-rose-800 shadow-xs'
                        : 'border-stone-200 text-stone-600 hover:border-stone-300'
                    }`}
                  >
                    <Truck className="w-4 h-4 text-rose-600" />
                    <span>🛵 Delivery a Domicilio (¡GRATIS!)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeliveryType('pickup')}
                    className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      deliveryType === 'pickup'
                        ? 'border-rose-500 bg-rose-50 text-rose-800 shadow-xs'
                        : 'border-stone-200 text-stone-600 hover:border-stone-300'
                    }`}
                  >
                    <Store className="w-4 h-4 text-rose-600" />
                    <span>🏪 Recojo en Tienda (Gratis)</span>
                  </button>
                </div>
              )}
            </div>

            {/* Customer Inputs */}
            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-stone-600 block mb-1">Tu Nombre *:</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Camila Morales"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-400 bg-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-stone-600 block mb-1">WhatsApp / Celular *:</label>
                  <input
                    type="tel"
                    required
                    placeholder="Ej. 987 654 321"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-400 bg-white"
                  />
                </div>
              </div>

              {totalQuantity >= 2 && activeDeliveryType === 'delivery' && (
                <div>
                  <label className="text-[11px] font-bold text-stone-600 block mb-1">Dirección exacta de Entrega *:</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Av. Principal 123 - Referencia"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-400 bg-white"
                  />
                </div>
              )}

              <div>
                <label className="text-[11px] font-bold text-stone-600 block mb-1">Indicaciones o dedicatoria (opcional):</label>
                <input
                  type="text"
                  placeholder="Ej. Escribir dedicatoria o instrucciones"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-400 bg-white"
                />
              </div>
            </div>
          </div>

          {/* Right Column: Dynamic Bill & Checkout (5 Cols) */}
          <div className="lg:col-span-5 p-6 sm:p-8 bg-[#FAF8F5] flex flex-col justify-between space-y-6">
            <div>
              <h3 className="font-serif-display text-xl font-bold text-[#2D1610] mb-4 pb-2 border-b border-stone-200/80">
                Resumen de tu Pedido
              </h3>

              {selectedItems.length > 0 ? (
                <div className="space-y-3 mb-6">
                  {selectedItems.map((item) => (
                    <div key={item.dessert.id} className="flex justify-between items-center text-xs">
                      <span className="text-stone-700 font-medium">
                        {item.quantity}x {item.dessert.name}
                      </span>
                      <span className="font-bold text-stone-900">
                        S/ {(item.dessert.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-stone-600 text-xs italic">
                  Selecciona al menos 1 postre para calcular.
                </div>
              )}

              {/* Delivery discount badge */}
              {totalQuantity > 0 && (
                <div className="mb-4">
                  {totalQuantity === 1 ? (
                    <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-200 text-rose-900 text-xs font-semibold flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <span>
                        Recojo en tienda en <strong>{BAKERY_ADDRESS}</strong> ({BAKERY_REFERENCE}).
                      </span>
                    </div>
                  ) : activeDeliveryType === 'delivery' ? (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>
                        ¡Felicidades! Tienes <strong>Delivery GRATIS</strong> ({totalQuantity} unidades).
                      </span>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-stone-100 border border-stone-200 text-stone-800 text-xs font-semibold flex items-center gap-2">
                      <Store className="w-4 h-4 text-stone-600 shrink-0" />
                      <span>Recojo en tienda sin costo de envío.</span>
                    </div>
                  )}
                </div>
              )}

              {/* Breakdown */}
              <div className="space-y-2 pt-4 border-t border-stone-200/80 text-xs">
                <div className="flex justify-between text-stone-600">
                  <span>Subtotal postres ({totalQuantity} uds):</span>
                  <span className="font-semibold text-stone-800">S/ {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Costo de envío:</span>
                  <span className="font-bold text-emerald-700">
                    {totalQuantity === 0 ? 'S/ 0.00' : totalQuantity === 1 ? 'S/ 0.00 (Recojo en Tienda)' : '¡GRATIS! (Delivery a Domicilio)'}
                  </span>
                </div>
                <div className="flex justify-between items-baseline pt-3 border-t border-stone-300 font-bold">
                  <span className="text-base text-[#2D1610]">Total a Pagar:</span>
                  <span className="text-2xl font-black text-[#2D1610] font-sans">
                    <span className="text-base text-rose-600 mr-0.5">S/</span>{grandTotal.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3 pt-4">
              {/* WhatsApp direct order button */}
              <button
                id="btn-calc-whatsapp-order"
                onClick={handleSendWhatsAppOrder}
                disabled={totalQuantity === 0}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-102 active:scale-95 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 fill-white" />
                <span>Pedir por WhatsApp ({BAKERY_PHONE_FORMATTED})</span>
              </button>

              {/* Add to Cart button */}
              <button
                id="btn-calc-add-cart"
                onClick={handleAddAllToCart}
                disabled={totalQuantity === 0}
                className="w-full py-3 px-4 rounded-xl bg-white hover:bg-stone-50 text-stone-800 border border-stone-300 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4 text-rose-600" />
                <span>Añadir selección al Carrito</span>
              </button>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};

