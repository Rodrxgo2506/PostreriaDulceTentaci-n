import React, { useState, useEffect } from 'react';
import { CartItem } from '../types';
import { 
  X, Lock, ShieldCheck, CreditCard, Smartphone, CheckCircle, 
  MessageCircle, Sparkles, AlertTriangle, Store, Truck, MapPin
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { 
  BAKERY_NAME, BAKERY_PHONE_NUMBER, BAKERY_PHONE_FORMATTED, 
  BAKERY_ADDRESS, BAKERY_REFERENCE 
} from '../data/desserts';
import { createWhatsAppUrl } from '../utils/whatsapp';
import { registerOrderCodeInCloud } from '../utils/reviewsStorage';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  customerInfo: {
    name: string;
    phone: string;
    email?: string;
    address?: string;
    deliveryType: string;
    notes?: string;
  };
  onPaymentSuccess: (orderId: string) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  items,
  subtotal,
  deliveryFee = 0,
  customerInfo: initialCustomerInfo,
  onPaymentSuccess,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<'qr' | 'card' | 'wallet'>('qr');
  
  // Editable customer info in modal in case they need to fill or amend it
  const [name, setName] = useState(initialCustomerInfo.name || '');
  const [phone, setPhone] = useState(initialCustomerInfo.phone || '');
  const [address, setAddress] = useState(initialCustomerInfo.address || '');
  const [yapeOpNumber, setYapeOpNumber] = useState('');
  
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState(initialCustomerInfo.name || '');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedOrderId, setCompletedOrderId] = useState<string | null>(null);
  const [alertError, setAlertError] = useState<string | null>(null);

  // Lock background body scroll when modal is open
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

  const totalQuantity = items.reduce((acc, it) => acc + it.quantity, 0);
  const total = subtotal; // No delivery fee, no coupon discount
  const isPickup = totalQuantity === 1 || initialCustomerInfo.deliveryType === 'pickup';

  // Format 16 digits into chunks of 4
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
    const formatted = raw.match(/.{1,4}/g)?.join(' ') || raw;
    setCardNumber(formatted);
  };

  // Format MM/YY
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (raw.length >= 3) {
      setExpiry(`${raw.slice(0, 2)}/${raw.slice(2, 4)}`);
    } else {
      setExpiry(raw);
    }
  };

  const handleProcessPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setAlertError(null);

    // Validation for Yape / Plin and all methods
    if (!name.trim() || !phone.trim()) {
      const err = '⚠️ ¡Atención! Debes rellenar tus datos (Nombre y Teléfono / WhatsApp) para validar el pago por Yape / Plin.';
      setAlertError(err);
      alert(err);
      return;
    }

    if (!isPickup && !address.trim()) {
      const err = '⚠️ ¡Atención! Por favor ingresa la Dirección de entrega para el Delivery a Domicilio.';
      setAlertError(err);
      alert(err);
      return;
    }

    setIsProcessing(true);

    setTimeout(async () => {
      setIsProcessing(false);
      const generatedOrderId = `DT-${Math.floor(100000 + Math.random() * 900000)}`;
      setCompletedOrderId(generatedOrderId);
      onPaymentSuccess(generatedOrderId);

      // Register order code in Firestore for review verification
      const dessertNames = items.map((it) => `${it.dessert.name} (x${it.quantity})`);
      await registerOrderCodeInCloud(
        generatedOrderId, 
        name || initialCustomerInfo.name || 'Cliente', 
        dessertNames, 
        total
      );

      // Trigger celebration confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#F43F5E', '#EC4899', '#FB7185', '#FBBF24', '#10B981'],
      });
    }, 1500);
  };

  const handleSendReceiptToWhatsApp = () => {
    if (!completedOrderId) return;
    let msg = `🌸 *¡Comprobante de Pago Aprobado - ${BAKERY_NAME}!* 🍰\n\n`;
    msg += `🧾 *Orden N°:* ${completedOrderId}\n`;
    msg += `👤 *Cliente:* ${name || initialCustomerInfo.name}\n`;
    msg += `📱 *Teléfono:* ${phone || initialCustomerInfo.phone}\n`;
    msg += `📦 *Modalidad:* ${isPickup ? `Recojo en Tienda (${BAKERY_ADDRESS} - ${BAKERY_REFERENCE})` : `Envío a Domicilio (Dirección: ${address || initialCustomerInfo.address})`}\n`;
    if (yapeOpNumber.trim()) {
      msg += `🔢 *N° Operación Yape/Plin:* ${yapeOpNumber.trim()}\n`;
    }
    msg += `\n🍰 *Postres Pagados:*\n`;
    items.forEach((it) => {
      msg += `• ${it.dessert.name} (x${it.quantity}) - S/ ${(it.dessert.price * it.quantity).toFixed(2)}\n`;
    });
    msg += `\n💰 *Total Pagado:* S/ ${total.toFixed(2)}\n`;
    msg += `🔒 *Método:* ${paymentMethod === 'qr' ? 'Yape / Plin' : paymentMethod.toUpperCase()} (Transacción Registrada)\n\n`;
    msg += `⭐ *Código para Opinión Verificada:* #${completedOrderId}\n`;
    msg += `(Al disfrutar tu postre, califícanos en nuestra web usando tu código).\n\n`;
    msg += `¡Muchas gracias! Quedo a la espera de la entrega. 💕`;

    window.open(createWhatsAppUrl(BAKERY_PHONE_NUMBER, msg), '_blank', 'noopener,noreferrer');
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadeIn overscroll-contain"
      onClick={onClose}
    >
      <div
        id="secure-payment-modal"
        className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-rose-100 my-auto flex flex-col max-h-[92vh] overscroll-contain"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-600 to-pink-600 px-6 py-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <Lock className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-serif-display text-lg font-bold">Pasarela de Pagos Dulce Tentación</h3>
              <p className="text-[11px] text-rose-100 flex items-center gap-1 font-sans">
                <ShieldCheck className="w-3.5 h-3.5" />
                Cifrado Seguro SSL 256-Bit & Pagos Directos
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6 overflow-y-auto overscroll-contain">
          
          {/* If already completed: Voucher View */}
          {completedOrderId ? (
            <div className="text-center space-y-5 py-4 animate-fadeIn">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-lg shadow-emerald-100">
                <CheckCircle className="w-10 h-10" />
              </div>

              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
                  ¡Transacción Registrada con Éxito!
                </span>
                <h2 className="font-serif-display text-3xl font-bold text-stone-900 mt-2">
                  ¡Gracias por tu compra en Dulce Tentación!
                </h2>
                <p className="text-xs sm:text-sm text-stone-600 mt-1">
                  Tu orden ha sido guardada. Por favor envía tu confirmación a nuestro WhatsApp para coordinar tu entrega o recojo de inmediato.
                </p>
              </div>

              {/* Receipt Summary Box */}
              <div className="bg-rose-50/50 rounded-2xl p-5 border border-rose-100 text-left text-xs text-stone-700 space-y-2.5 max-w-md mx-auto">
                <div className="flex justify-between font-mono font-bold text-stone-900 border-b border-rose-100 pb-2">
                  <span>N° de Pedido:</span>
                  <span className="text-rose-600">{completedOrderId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Cliente:</span>
                  <span className="font-semibold">{name || initialCustomerInfo.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Modalidad:</span>
                  <span className="font-semibold">
                    {isPickup ? `Recojo en Tienda (${BAKERY_ADDRESS})` : 'Envío a Domicilio (¡Gratis!)'}
                  </span>
                </div>
                {!isPickup && address && (
                  <div className="flex justify-between">
                    <span className="text-stone-500">Dirección:</span>
                    <span className="font-semibold">{address}</span>
                  </div>
                )}
                {yapeOpNumber && (
                  <div className="flex justify-between">
                    <span className="text-stone-500">N° Op. Yape/Plin:</span>
                    <span className="font-mono font-bold text-purple-700">{yapeOpNumber}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-stone-500">Total:</span>
                  <span className="font-serif-display text-lg font-black text-rose-600">
                    S/ {total.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-[11px] text-stone-400 pt-1 border-t border-rose-100">
                  <span>Estado:</span>
                  <span className="text-emerald-600 font-bold">● Aprobado & En Preparación</span>
                </div>

                <div className="mt-2 p-2.5 bg-amber-50/90 rounded-xl border border-amber-200 text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-amber-900 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      Tu Código de Compra Verificada:
                    </span>
                    <span className="font-mono font-black text-xs text-rose-600 bg-white px-2 py-0.5 rounded-md border border-amber-200">
                      #{completedOrderId}
                    </span>
                  </div>
                  <p className="text-[10px] text-amber-800 mt-1 leading-snug">
                    Usa este código en la sección de testimonios de la web cuando recibas tus postres para dejar tu opinión real.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  onClick={handleSendReceiptToWhatsApp}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-200 transition-all cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 fill-white" />
                  <span>Enviar Confirmación a WhatsApp ({BAKERY_PHONE_FORMATTED})</span>
                </button>

                <button
                  onClick={onClose}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold text-xs sm:text-sm transition-all cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>
          ) : (
            /* Payment Form */
            <form onSubmit={handleProcessPayment} className="space-y-5">
              
              {/* Total To Pay Box */}
              <div className="bg-rose-50/70 rounded-2xl p-4 border border-rose-100 flex items-center justify-between">
                <div>
                  <span className="text-xs text-stone-500 block">Total a pagar:</span>
                  <span className="font-serif-display text-2xl font-black text-rose-600">
                    S/ {total.toFixed(2)}
                  </span>
                </div>
                <div className="text-right text-xs text-stone-600">
                  <span className="font-bold block">{totalQuantity} postre(s) a S/ 10 c/u</span>
                  <span className="text-[11px] text-emerald-700 font-semibold">
                    {isPickup ? '🏪 Recojo en tienda (S/ 0.00)' : '🛵 Delivery a Domicilio (¡GRATIS!)'}
                  </span>
                </div>
              </div>

              {/* Alert Error Box if missing data */}
              {alertError && (
                <div className="p-3.5 bg-red-50 border border-red-300 rounded-2xl text-red-800 text-xs flex items-start gap-2.5 animate-shake">
                  <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block">Datos Incompletos:</strong>
                    <span>{alertError}</span>
                  </div>
                </div>
              )}

              {/* Customer Identification Info Box */}
              <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
                    <span>👤</span> Tus Datos de Contacto (Obligatorio):
                  </span>
                  <span className="text-[11px] text-rose-600 font-semibold">* Campos obligatorios</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-stone-600 block mb-1">Nombre Completo *</label>
                    <input
                      type="text"
                      required
                      placeholder="Tu Nombre"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (alertError) setAlertError(null);
                      }}
                      className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-rose-400 bg-white ${
                        alertError && !name.trim() ? 'border-red-400 ring-1 ring-red-300' : 'border-stone-200'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-stone-600 block mb-1">WhatsApp / Celular *</label>
                    <input
                      type="tel"
                      required
                      placeholder="Tu Número Celular"
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        if (alertError) setAlertError(null);
                      }}
                      className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-rose-400 bg-white ${
                        alertError && !phone.trim() ? 'border-red-400 ring-1 ring-red-300' : 'border-stone-200'
                      }`}
                    />
                  </div>
                </div>

                {!isPickup && (
                  <div>
                    <label className="text-[11px] font-bold text-stone-600 block mb-1">Dirección de Entrega *</label>
                    <input
                      type="text"
                      required
                      placeholder="Dirección exacta para el delivery"
                      value={address}
                      onChange={(e) => {
                        setAddress(e.target.value);
                        if (alertError) setAlertError(null);
                      }}
                      className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-rose-400 bg-white ${
                        alertError && !address.trim() ? 'border-red-400 ring-1 ring-red-300' : 'border-stone-200'
                      }`}
                    />
                  </div>
                )}
              </div>

              {/* Payment Methods Selector Tabs */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-2">
                  Selecciona tu Método de Pago:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod('qr');
                      if (!name.trim() || !phone.trim()) {
                        setAlertError('⚠️ Recuerda: Debes rellenar tus datos (Nombre y Teléfono) para validar tu pago con Yape / Plin.');
                      }
                    }}
                    className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1 cursor-pointer ${
                      paymentMethod === 'qr'
                        ? 'border-purple-600 bg-purple-50 ring-2 ring-purple-200 text-purple-900 font-bold'
                        : 'border-stone-200 hover:bg-stone-50 text-stone-600'
                    }`}
                  >
                    <Smartphone className="w-5 h-5 text-purple-600" />
                    <span className="text-xs">Yape / Plin</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1 cursor-pointer ${
                      paymentMethod === 'card'
                        ? 'border-rose-600 bg-rose-50/70 ring-2 ring-rose-200 text-rose-700 font-bold'
                        : 'border-stone-200 hover:bg-stone-50 text-stone-600'
                    }`}
                  >
                    <CreditCard className="w-5 h-5 text-rose-500" />
                    <span className="text-xs">Tarjeta Déb./Créd.</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('wallet')}
                    className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1 cursor-pointer ${
                      paymentMethod === 'wallet'
                        ? 'border-rose-600 bg-rose-50/70 ring-2 ring-rose-200 text-rose-700 font-bold'
                        : 'border-stone-200 hover:bg-stone-50 text-stone-600'
                    }`}
                  >
                    <Sparkles className="w-5 h-5 text-amber-500" />
                    <span className="text-xs">Billetera Móvil</span>
                  </button>
                </div>
              </div>

              {/* QR / YAPE / PLIN METHOD */}
              {paymentMethod === 'qr' && (
                <div className="p-4 bg-purple-50/80 border border-purple-200 rounded-2xl space-y-3 animate-fadeIn">
                  <div className="text-center space-y-1">
                    <span className="text-xs font-bold text-purple-950 block">
                      📱 Paga Fácil con Yape o Plin
                    </span>
                    <p className="text-[11px] text-purple-800">
                      Escanea el código QR o transfiere al número oficial de Dulce Tentación.
                    </p>
                  </div>
                  
                  {/* QR Graphic */}
                  <div className="w-36 h-36 bg-white p-2 rounded-2xl mx-auto border border-purple-200 shadow-md flex items-center justify-center">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=YAPE-DULCE-TENTACION-${BAKERY_PHONE_NUMBER}`}
                      alt="QR de Pago Yape"
                      className="w-full h-full object-contain"
                    />
                  </div>

                  <div className="text-xs text-purple-950 text-center space-y-1 bg-white/80 p-3 rounded-xl border border-purple-100">
                    <p className="font-extrabold text-sm text-purple-900">📱 Número: {BAKERY_PHONE_FORMATTED}</p>
                    <p className="font-medium text-stone-700">Titular: Dulce Tentación</p>
                    <p className="text-xs text-rose-600 font-black">Monto exacto: S/ {total.toFixed(2)}</p>
                  </div>

                  {/* Operation code / voucher note */}
                  <div>
                    <label className="text-[11px] font-bold text-purple-950 block mb-1">
                      Número de Operación de Yape / Plin (Opcional):
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. 984521"
                      value={yapeOpNumber}
                      onChange={(e) => setYapeOpNumber(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-purple-400 font-mono"
                    />
                  </div>

                  {/* Mandatory Alert reminder */}
                  <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px] flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>Importante:</strong> Tus datos de contacto (Nombre y Celular) deben estar llenos arriba para asociar tu comprobante correctamente.
                    </span>
                  </div>
                </div>
              )}

              {/* CARD DETAILS FORM */}
              {paymentMethod === 'card' && (
                <div className="space-y-4 animate-fadeIn">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Número de Tarjeta
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        placeholder="4532 8920 1234 5678"
                        value={cardNumber}
                        onChange={handleCardNumberChange}
                        maxLength={19}
                        className="w-full px-4 py-2.5 rounded-xl border border-rose-200 focus:outline-none focus:ring-2 focus:ring-rose-400 text-xs sm:text-sm font-mono text-stone-800"
                      />
                      <CreditCard className="absolute right-3.5 top-3 w-4 h-4 text-stone-400" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Nombre del Titular
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Como figura en la tarjeta"
                        value={cardHolder}
                        onChange={(e) => setCardHolder(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-rose-200 focus:outline-none focus:ring-2 focus:ring-rose-400 text-xs sm:text-sm text-stone-800"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1">
                          Vencimiento
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="MM/AA"
                          value={expiry}
                          onChange={handleExpiryChange}
                          maxLength={5}
                          className="w-full px-3 py-2.5 rounded-xl border border-rose-200 focus:outline-none focus:ring-2 focus:ring-rose-400 text-xs sm:text-sm text-center font-mono text-stone-800"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1">
                          CVV
                        </label>
                        <input
                          type="password"
                          required
                          placeholder="123"
                          value={cvv}
                          onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                          maxLength={4}
                          className="w-full px-3 py-2.5 rounded-xl border border-rose-200 focus:outline-none focus:ring-2 focus:ring-rose-400 text-xs sm:text-sm text-center font-mono text-stone-800"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* WALLET (Apple / Google Pay) */}
              {paymentMethod === 'wallet' && (
                <div className="p-5 bg-stone-50 border border-stone-200 rounded-2xl text-center space-y-3 animate-fadeIn">
                  <div className="flex justify-center gap-4 text-stone-800 text-lg font-bold">
                    <span>📱 Billeteras Digitales</span>
                  </div>
                  <p className="text-xs text-stone-600">
                    Paga de forma rápida y segura desde tu teléfono móvil.
                  </p>
                </div>
              )}

              {/* Security badges */}
              <div className="flex items-center justify-center gap-4 text-[11px] text-stone-400 pt-1">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Cifrado SSL Protegido
                </span>
                <span>•</span>
                <span>Postres Frescos del Día</span>
              </div>

              {/* Submit Payment CTA */}
              <button
                type="submit"
                disabled={isProcessing}
                id="btn-confirm-payment"
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 disabled:opacity-50 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-rose-200 hover:shadow-rose-300 transition-all cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Validando Pago Seguro...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Confirmar Pago S/ {total.toFixed(2)}</span>
                  </>
                )}
              </button>

            </form>
          )}

        </div>
      </div>
    </div>
  );
};
