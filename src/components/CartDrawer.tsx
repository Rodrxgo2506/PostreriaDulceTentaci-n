import React, { useState, useEffect } from 'react';
import { CartItem } from '../types';
import { 
  X, Trash2, ShoppingBag, Plus, Minus, MessageCircle, 
  Lock, CheckCircle2, Store, Truck, AlertTriangle, MapPin
} from 'lucide-react';
import { 
  DELIVERY_PROMO_THRESHOLD, BAKERY_ADDRESS, BAKERY_REFERENCE 
} from '../data/desserts';
import { generateCartOrderWhatsAppMessage, sendToWhatsApp } from '../utils/whatsapp';
import { registerOrderCodeInCloud } from '../utils/reviewsStorage';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (id: string, newQuantity: number) => void;
  onRemoveItem: (id: string) => void;
  onOpenPaymentGateway: (customerInfo: {
    name: string;
    phone: string;
    email: string;
    address: string;
    deliveryType: string;
    notes?: string;
  }, deliveryFee: number) => void;
  onExploreMenu: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onOpenPaymentGateway,
  onExploreMenu,
}) => {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [deliveryType, setDeliveryType] = useState<'delivery' | 'pickup'>('delivery');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [validationAlert, setValidationAlert] = useState<string | null>(null);

  // Lock background body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const totalItemCount = items.reduce((acc, it) => acc + it.quantity, 0);
  const subtotal = items.reduce((acc, it) => acc + it.dessert.price * it.quantity, 0);
  
  // Rule: 1 item is always pickup (free). 2+ items can be free delivery or pickup.
  const activeDeliveryType = totalItemCount === 1 ? 'pickup' : deliveryType;
  const deliveryFee = 0;
  const total = subtotal;

  const validateCustomerData = (forMethodName = 'Yape / Plin'): boolean => {
    setValidationAlert(null);
    if (!customerName.trim() && !customerPhone.trim()) {
      const err = `⚠️ ¡Atención! Debes rellenar tus datos (Nombre y WhatsApp / Celular) para pagar con ${forMethodName}.`;
      setValidationAlert(err);
      alert(err);
      return false;
    }
    if (!customerName.trim()) {
      const err = `⚠️ ¡Atención! Por favor ingresa tu Nombre completo para pagar con ${forMethodName}.`;
      setValidationAlert(err);
      alert(err);
      return false;
    }
    if (!customerPhone.trim()) {
      const err = `⚠️ ¡Atención! Por favor ingresa tu número de WhatsApp / Celular para pagar con ${forMethodName}.`;
      setValidationAlert(err);
      alert(err);
      return false;
    }
    if (totalItemCount >= 2 && activeDeliveryType === 'delivery' && !deliveryAddress.trim()) {
      const err = `⚠️ ¡Atención! Por favor ingresa tu Dirección de Entrega para el Delivery a Domicilio.`;
      setValidationAlert(err);
      alert(err);
      return false;
    }
    return true;
  };

  const handleCheckoutWhatsApp = async () => {
    if (!validateCustomerData('WhatsApp')) {
      return;
    }
    const orderCode = `DT-${Math.floor(100000 + Math.random() * 900000)}`;
    
    // Register in Firestore in background
    const dessertNames = items.map((it) => `${it.dessert.name} (x${it.quantity})`);
    registerOrderCodeInCloud(
      orderCode,
      customerName.trim() || 'Cliente',
      dessertNames,
      subtotal
    );

    const msg = generateCartOrderWhatsAppMessage(
      items,
      {
        name: customerName,
        phone: customerPhone,
        address: deliveryAddress,
        deliveryType: activeDeliveryType,
        notes: orderNotes,
      },
      deliveryFee,
      orderCode
    );
    sendToWhatsApp(msg);
  };

  const handleCheckoutGateway = () => {
    if (!validateCustomerData('Yape / Plin')) {
      return;
    }
    onOpenPaymentGateway(
      {
        name: customerName,
        phone: customerPhone,
        email: customerEmail,
        address: deliveryAddress,
        deliveryType: activeDeliveryType,
        notes: orderNotes,
      },
      deliveryFee
    );
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-hidden bg-stone-900/60 backdrop-blur-sm flex justify-end animate-fadeIn overscroll-contain"
      onClick={onClose}
    >
      <div
        id="cart-slideover"
        className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between overflow-hidden overscroll-contain"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-rose-100 flex items-center justify-between bg-[#FFF8F9]">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif-display text-xl font-bold text-[#5B2E1E]">
                Tu Carrito Dulce Tentación
              </h3>
              <p className="text-[11px] text-rose-600 font-semibold">
                {totalItemCount} postre(s) en tu orden
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-rose-100/50 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Items Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-12">
              <div className="w-20 h-20 rounded-full bg-rose-50 flex items-center justify-center text-4xl border border-rose-100">
                🍰
              </div>
              <div>
                <h4 className="font-serif-display text-2xl font-bold text-stone-800">
                  Tu carrito está vacío
                </h4>
                <p className="text-xs text-stone-500 max-w-xs mt-1">
                  Añade Torta de Tres Leches, Crema Volteada o Cheesecake de Maracuyá para comenzar.
                </p>
              </div>
              <button
                onClick={() => {
                  onClose();
                  onExploreMenu();
                }}
                className="px-6 py-2.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow transition-all cursor-pointer"
              >
                Ver Postres en Stock (S/ 10)
              </button>
            </div>
          ) : (
            <>
              {/* Promo / Delivery Banner in Cart */}
              {totalItemCount === 1 ? (
                <div className="bg-amber-50 border border-amber-200 p-3 rounded-2xl text-amber-900 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <Store className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>1 unidad: Recojo en tienda (Sin costo de envío)</span>
                  </div>
                  <p className="text-[11px] text-amber-800">
                    📍 {BAKERY_ADDRESS} ({BAKERY_REFERENCE}).
                  </p>
                  <p className="text-[11px] text-rose-700 font-semibold pt-0.5">
                    💡 ¡Agrega <strong>1 postre más</strong> para obtener <strong>DELIVERY GRATIS</strong> a tu puerta!
                  </p>
                </div>
              ) : (
                <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl flex items-center gap-2 text-emerald-800 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span><strong>¡DELIVERY GRATIS Incluido!</strong> ({totalItemCount} postres)</span>
                </div>
              )}

              {/* Item list */}
              <div className="space-y-3">
                {items.map((item) => (
                  <div
                    key={item.dessert.id}
                    className="flex gap-3 bg-[#FFFBFB] p-3 rounded-2xl border border-rose-100/80 shadow-sm"
                  >
                    {/* Item thumb */}
                    <img
                      src={item.dessert.image}
                      alt={item.dessert.name}
                      className="w-16 h-16 rounded-xl object-cover border border-rose-100 shrink-0"
                    />

                    {/* Details */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div className="flex items-start justify-between gap-1">
                        <h4 className="font-serif-display text-sm font-bold text-stone-900 truncate">
                          {item.dessert.name}
                        </h4>
                        <button
                          onClick={() => onRemoveItem(item.dessert.id)}
                          className="text-stone-400 hover:text-rose-600 transition-colors p-1 cursor-pointer"
                          title="Eliminar del carrito"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {item.customDedication && (
                        <p className="text-[10px] text-rose-600 italic truncate">
                          &ldquo;{item.customDedication}&rdquo;
                        </p>
                      )}

                      <div className="flex items-center justify-between pt-1">
                        <span className="font-serif-display text-sm font-black text-rose-600">
                          S/ {(item.dessert.price * item.quantity).toFixed(2)}
                        </span>

                        {/* Quantity Counter */}
                        <div className="flex items-center border border-rose-200 rounded-lg bg-white overflow-hidden text-xs">
                          <button
                            onClick={() => onUpdateQuantity(item.dessert.id, item.quantity - 1)}
                            className="px-2 py-0.5 hover:bg-rose-50 text-stone-600 cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2 font-bold text-stone-800 min-w-[20px] text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => onUpdateQuantity(item.dessert.id, item.quantity + 1)}
                            className="px-2 py-0.5 hover:bg-rose-50 text-stone-600 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Validation Alert Banner if triggered */}
              {validationAlert && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs flex items-start gap-2 animate-shake">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span className="font-medium">{validationAlert}</span>
                </div>
              )}

              {/* Customer Quick Checkout Info */}
              <div className="bg-[#FFF5F7] p-4 rounded-2xl border border-rose-100 space-y-3 pt-3">
                <span className="text-xs font-bold text-stone-800 uppercase tracking-wider block">
                  Datos del Cliente (Requerido para Yape / Plin / Pedido):
                </span>

                {totalItemCount === 1 ? (
                  <div className="p-2.5 rounded-xl bg-white border border-rose-200 text-xs text-rose-900 font-semibold flex items-center gap-2">
                    <Store className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>🏪 Recojo en Tienda: {BAKERY_ADDRESS}</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setDeliveryType('delivery')}
                      className={`p-2.5 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                        deliveryType === 'delivery' ? 'border-rose-600 bg-white text-rose-700 shadow-sm' : 'border-rose-200 text-stone-600 bg-white/50'
                      }`}
                    >
                      🛵 Envío (¡GRATIS!)
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeliveryType('pickup')}
                      className={`p-2.5 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                        deliveryType === 'pickup' ? 'border-rose-600 bg-white text-rose-700 shadow-sm' : 'border-rose-200 text-stone-600 bg-white/50'
                      }`}
                    >
                      🏪 Recojo (Gratis)
                    </button>
                  </div>
                )}

                <div className="space-y-2">
                  <div>
                    <input
                      type="text"
                      required
                      placeholder="Tu Nombre Completo *"
                      value={customerName}
                      onChange={(e) => {
                        setCustomerName(e.target.value);
                        if (validationAlert) setValidationAlert(null);
                      }}
                      className={`w-full px-3 py-2 rounded-xl border bg-white text-xs focus:outline-none focus:ring-2 focus:ring-rose-400 ${
                        validationAlert && !customerName.trim() ? 'border-red-400 ring-1 ring-red-300' : 'border-rose-200'
                      }`}
                    />
                  </div>

                  <div>
                    <input
                      type="tel"
                      required
                      placeholder="Tu WhatsApp / Celular *"
                      value={customerPhone}
                      onChange={(e) => {
                        setCustomerPhone(e.target.value);
                        if (validationAlert) setValidationAlert(null);
                      }}
                      className={`w-full px-3 py-2 rounded-xl border bg-white text-xs focus:outline-none focus:ring-2 focus:ring-rose-400 ${
                        validationAlert && !customerPhone.trim() ? 'border-red-400 ring-1 ring-red-300' : 'border-rose-200'
                      }`}
                    />
                  </div>

                  {totalItemCount >= 2 && activeDeliveryType === 'delivery' && (
                    <div>
                      <input
                        type="text"
                        required
                        placeholder="Dirección exacta de Entrega *"
                        value={deliveryAddress}
                        onChange={(e) => {
                          setDeliveryAddress(e.target.value);
                          if (validationAlert) setValidationAlert(null);
                        }}
                        className={`w-full px-3 py-2 rounded-xl border bg-white text-xs focus:outline-none focus:ring-2 focus:ring-rose-400 ${
                          validationAlert && !deliveryAddress.trim() ? 'border-red-400 ring-1 ring-red-300' : 'border-rose-200'
                        }`}
                      />
                    </div>
                  )}

                  <input
                    type="text"
                    placeholder="Indicaciones adicionales (opcional)"
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-rose-200 bg-white text-xs focus:outline-none focus:ring-1 focus:ring-rose-400"
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Sticky Drawer Footer with Totals and Double CTAs */}
        {items.length > 0 && (
          <div className="p-5 border-t border-rose-100 bg-[#FFFBFB] space-y-3">
            <div className="space-y-1 text-xs text-stone-600">
              <div className="flex justify-between">
                <span>Subtotal ({totalItemCount} postres):</span>
                <span>S/ {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Modalidad de entrega:</span>
                <span>
                  {totalItemCount === 1 ? (
                    <span className="text-emerald-700 font-bold">Recojo en Jr. Manco Cápac 653</span>
                  ) : activeDeliveryType === 'pickup' ? (
                    <span className="text-emerald-700 font-bold">Recojo en Tienda (S/ 0.00)</span>
                  ) : (
                    <span className="text-emerald-700 font-bold">¡DELIVERY GRATIS!</span>
                  )}
                </span>
              </div>
              <div className="flex justify-between text-base font-bold text-stone-900 border-t border-rose-100 pt-2">
                <span>Total a Pagar:</span>
                <span className="font-serif-display text-2xl font-black text-rose-600">
                  S/ {total.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              {/* Yape / Plin / Online Button */}
              <button
                id="btn-cart-checkout-gateway"
                onClick={handleCheckoutGateway}
                className="w-full py-3.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-purple-200 transition-all cursor-pointer"
              >
                <Lock className="w-4 h-4" />
                <span>Pagar con Yape / Plin (S/ {total.toFixed(2)})</span>
              </button>

              {/* WhatsApp Checkout Button */}
              <button
                id="btn-cart-checkout-whatsapp"
                onClick={handleCheckoutWhatsApp}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 fill-emerald-600 text-emerald-600" />
                <span>Confirmar Pedido por WhatsApp</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
