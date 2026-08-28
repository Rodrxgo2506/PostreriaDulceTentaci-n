import React, { useState, useEffect, useRef } from 'react';
import { CartItem, CustomerOrderRecord } from '../types';
import {
  X, Lock, ShieldCheck, Smartphone, CheckCircle,
  MessageCircle, Sparkles, AlertTriangle, Store, Truck, MapPin,
  Upload, Image as ImageIcon, Trash2, ZoomIn
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  BAKERY_NAME, BAKERY_PHONE_NUMBER, BAKERY_PHONE_FORMATTED,
  BAKERY_ADDRESS, BAKERY_REFERENCE
} from '../data/desserts';
import { createWhatsAppUrl } from '../utils/whatsapp';
import { registerOrderCodeInCloud } from '../utils/reviewsStorage';
import { createOrderInCloud } from '../utils/ordersStorage';
import { optimizeImageFile } from '../utils/dessertStorage';

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
  // Customer info in modal
  const [name, setName] = useState(initialCustomerInfo.name || '');
  const [phone, setPhone] = useState(initialCustomerInfo.phone || '');
  const [address, setAddress] = useState(initialCustomerInfo.address || '');
  const [yapeOpNumber, setYapeOpNumber] = useState('');
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);
  const [isZoomingQr, setIsZoomingQr] = useState(false);

  const [isProcessing, setIsProcessing] = useState(false);
  const [completedOrderId, setCompletedOrderId] = useState<string | null>(null);
  const [alertError, setAlertError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset states whenever modal opens to prevent showing previous completed receipt
  useEffect(() => {
    if (isOpen) {
      setCompletedOrderId(null);
      setName(initialCustomerInfo.name || '');
      setPhone(initialCustomerInfo.phone || '');
      setAddress(initialCustomerInfo.address || '');
      setYapeOpNumber('');
      setReceiptImage(null);
      setAlertError(null);
      setIsProcessing(false);

      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen, initialCustomerInfo]);

  if (!isOpen) return null;

  const totalQuantity = items.reduce((acc, it) => acc + it.quantity, 0);
  const total = subtotal;
  const isPickup = totalQuantity === 1 || initialCustomerInfo.deliveryType === 'pickup';

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingReceipt(true);
      const compressed = await optimizeImageFile(file, 1000, 0.85);
      setReceiptImage(compressed);
      if (alertError) setAlertError(null);
    } catch (err) {
      console.error('Error al cargar comprobante:', err);
      alert('No se pudo procesar la imagen del comprobante. Intenta con otra foto.');
    } finally {
      setIsUploadingReceipt(false);
    }
  };

  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlertError(null);

    // Validation for contact data
    if (!name.trim() || !phone.trim()) {
      const err = '⚠️ ¡Atención! Por favor completa tu Nombre y Teléfono / WhatsApp para registrar tu pedido.';
      setAlertError(err);
      return;
    }

    if (!isPickup && !address.trim()) {
      const err = '⚠️ ¡Atención! Por favor ingresa la Dirección de entrega para el Delivery a Domicilio.';
      setAlertError(err);
      return;
    }

    setIsProcessing(true);

    const generatedOrderId = `DT-${Math.floor(100000 + Math.random() * 900000)}`;

    try {
      // 1. Create full order record in Cloud (Firestore & local cache)
      const orderRecord: CustomerOrderRecord = {
        id: generatedOrderId,
        customerName: name.trim() || initialCustomerInfo.name || 'Cliente',
        phone: phone.trim() || initialCustomerInfo.phone || '',
        email: initialCustomerInfo.email || '',
        address: !isPickup ? (address.trim() || initialCustomerInfo.address || '') : `Recojo en Tienda (${BAKERY_ADDRESS})`,
        deliveryType: isPickup ? 'pickup' : 'delivery',
        notes: initialCustomerInfo.notes || '',
        items: items.map((it) => ({
          id: it.dessert.id,
          name: it.dessert.name,
          price: it.dessert.price,
          quantity: it.quantity,
          image: it.dessert.image,
          selectedSize: it.selectedSize,
          customDedication: it.customDedication,
        })),
        total,
        paymentMethod: 'Yape / Plin',
        yapeOpNumber: yapeOpNumber.trim() || undefined,
        receiptImageUrl: receiptImage || undefined,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };

      await createOrderInCloud(orderRecord);

      // 2. Register order code in Firestore for review verification
      const dessertNames = items.map((it) => `${it.dessert.name} (x${it.quantity})`);
      await registerOrderCodeInCloud(
        generatedOrderId,
        name || initialCustomerInfo.name || 'Cliente',
        dessertNames,
        total
      );

      setCompletedOrderId(generatedOrderId);
      onPaymentSuccess(generatedOrderId);

      // Celebration Confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#F43F5E', '#EC4899', '#FB7185', '#FBBF24', '#10B981'],
      });
    } catch (err) {
      console.error('Error al registrar pedido:', err);
    } finally {
      setIsProcessing(false);
    }
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
    if (receiptImage) {
      msg += `📸 *Comprobante de Pago:* Adjuntado desde la Web\n`;
    }
    msg += `\n🍰 *Postres Pagados:*\n`;
    items.forEach((it) => {
      msg += `• ${it.dessert.name} (x${it.quantity}) - S/ ${(it.dessert.price * it.quantity).toFixed(2)}\n`;
    });
    msg += `\n💰 *Total Pagado:* S/ ${total.toFixed(2)}\n`;
    msg += `🔒 *Método:* Yape / Plin (Transacción Registrada)\n\n`;
    msg += `⭐ *Código para Opinión Verificada:* #${completedOrderId}\n`;
    msg += `(Al disfrutar tu postre, califícanos en nuestra web usando tu código).\n\n`;
    msg += `¡Muchas gracias! Quedo a la espera de la confirmación y entrega. 💕`;

    window.open(createWhatsAppUrl(BAKERY_PHONE_NUMBER, msg), '_blank', 'noopener,noreferrer');
  };

  const handleCloseModal = () => {
    setCompletedOrderId(null);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadeIn overscroll-contain"
      onClick={handleCloseModal}
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
                Pago Seguro Yape / Plin & Registro Inmediato
              </p>
            </div>
          </div>

          <button
            onClick={handleCloseModal}
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
                  Tu orden ha sido registrada en nuestro panel. Por favor envía tu confirmación a nuestro WhatsApp para coordinar tu entrega o recojo de inmediato.
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
                {receiptImage && (
                  <div className="pt-1">
                    <span className="text-stone-500 block mb-1">Comprobante adjuntado:</span>
                    <img
                      src={receiptImage}
                      alt="Comprobante"
                      className="w-20 h-20 object-cover rounded-xl border border-rose-200 shadow-xs"
                    />
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
                  <span className="text-emerald-600 font-bold">● Recibido & En Preparación</span>
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
                  className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-200 transition-all cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 fill-white" />
                  <span>Enviar Confirmación a WhatsApp ({BAKERY_PHONE_FORMATTED})</span>
                </button>

                <button
                  onClick={handleCloseModal}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold text-xs sm:text-sm transition-all cursor-pointer"
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
                  <span className="font-bold block">{totalQuantity} postre(s)</span>
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
                      className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-rose-400 bg-white ${alertError && !name.trim() ? 'border-red-400 ring-1 ring-red-300' : 'border-stone-200'
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
                      className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-rose-400 bg-white ${alertError && !phone.trim() ? 'border-red-400 ring-1 ring-red-300' : 'border-stone-200'
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
                      className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-rose-400 bg-white ${alertError && !address.trim() ? 'border-red-400 ring-1 ring-red-300' : 'border-stone-200'
                        }`}
                    />
                  </div>
                )}
              </div>

              {/* QR / YAPE / PLIN ONLY METHOD */}
              <div className="p-4 sm:p-5 bg-purple-50/90 border-2 border-purple-200 rounded-3xl space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-xs">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-purple-950">
                        Paga con Yape o Plin
                      </h4>
                      <p className="text-[11px] text-purple-700">
                        Escanea el código QR oficial de Dulce Tentación
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-purple-200 text-purple-900 text-[10px] font-bold uppercase tracking-wider">
                    Método Principal
                  </span>
                </div>

                {/* QR Graphic with click to zoom */}
                <div className="bg-white p-3 rounded-2xl mx-auto border border-purple-200 shadow-md flex flex-col items-center justify-center max-w-[220px]">
                  <div
                    className="relative group cursor-pointer overflow-hidden rounded-xl"
                    onClick={() => setIsZoomingQr(true)}
                  >
                    <img
                      src="/images/qr.jpg"
                      alt="QR de Pago Yape / Plin"
                      className="w-44 h-44 object-contain rounded-lg transition-transform group-hover:scale-105"
                      onError={(e) => {
                        // Fallback in case qr.jpg has caching issues
                        (e.target as HTMLImageElement).src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=YAPE-DULCE-TENTACION-${BAKERY_PHONE_NUMBER}`;
                      }}
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold rounded-lg gap-1">
                      <ZoomIn className="w-4 h-4" />
                      <span>Ampliar QR</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-stone-500 mt-2 font-medium">
                    Haz clic en el QR para ampliar
                  </span>
                </div>

                <div className="text-xs text-purple-950 text-center space-y-1 bg-white/90 p-3 rounded-2xl border border-purple-100">
                  <p className="font-extrabold text-sm text-purple-900">📱 Número: {BAKERY_PHONE_FORMATTED}</p>
                  <p className="font-medium text-stone-700">Titular: Mitsy Danixa Reategui Rodriguez</p>
                  <p className="text-xs text-rose-600 font-black">Monto exacto a transferir: S/ {total.toFixed(2)}</p>
                </div>

                {/* Operation Code */}
                <div>
                  <label className="text-[11px] font-bold text-purple-950 block mb-1">
                    Número de Operación de Yape / Plin (Opcional):
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. 984521"
                    value={yapeOpNumber}
                    onChange={(e) => setYapeOpNumber(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-purple-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-purple-400 font-mono text-stone-900"
                  />
                </div>

                {/* Subir Comprobante / Voucher Upload */}
                <div className="pt-1">
                  <label className="text-[11px] font-bold text-purple-950 block mb-1.5 flex items-center justify-between">
                    <span>📸 Subir Foto / Captura del Comprobante (Recomendado):</span>
                    {receiptImage && <span className="text-emerald-600 text-[10px] font-bold">✓ Imagen Cargada</span>}
                  </label>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleReceiptUpload}
                    className="hidden"
                  />

                  {receiptImage ? (
                    <div className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-purple-200 shadow-xs">
                      <img
                        src={receiptImage}
                        alt="Comprobante"
                        className="w-14 h-14 object-cover rounded-xl border border-purple-100 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-bold text-stone-800 block truncate">Comprobante de Pago</span>
                        <span className="text-[10px] text-stone-500">Se guardará automáticamente con tu pedido</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setReceiptImage(null);
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        className="p-2 rounded-xl text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                        title="Eliminar foto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={isUploadingReceipt}
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full p-3.5 border-2 border-dashed border-purple-300 hover:border-purple-500 bg-white/70 hover:bg-white rounded-2xl text-center flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer text-purple-900 group"
                    >
                      {isUploadingReceipt ? (
                        <div className="flex items-center gap-2 text-xs font-semibold">
                          <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                          <span>Procesando imagen...</span>
                        </div>
                      ) : (
                        <>
                          <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Upload className="w-4 h-4" />
                          </div>
                          <span className="text-xs font-bold">Adjuntar captura o foto de Yape / Plin</span>
                          <span className="text-[10px] text-purple-600">Haz clic aquí para seleccionar el archivo</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Info Note */}
                <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px] flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Importante:</strong> Al confirmar, tu pedido pasará a la lista de pedidos de la tienda y se abrirá WhatsApp con todos los detalles.
                  </span>
                </div>
              </div>

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
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 disabled:opacity-50 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-rose-200 hover:shadow-rose-300 transition-all cursor-pointer active:scale-[0.99]"
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Registrando Pedido en Dulce Tentación...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Confirmar Pedido S/ {total.toFixed(2)}</span>
                  </>
                )}
              </button>

            </form>
          )}

        </div>
      </div>

      {/* Modal Zoom QR */}
      {isZoomingQr && (
        <div
          className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setIsZoomingQr(false)}
        >
          <div className="relative bg-white p-4 rounded-3xl max-w-sm w-full shadow-2xl text-center space-y-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center pb-2 border-b border-stone-100">
              <span className="font-bold text-sm text-stone-900">QR de Pago Yape / Plin</span>
              <button
                onClick={() => setIsZoomingQr(false)}
                className="p-1 rounded-full hover:bg-stone-100 text-stone-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <img
              src="/images/qr.png"
              alt="QR Ampliado"
              className="w-full max-h-80 object-contain rounded-2xl mx-auto"
            />
            <div className="text-xs text-stone-600">
              <p className="font-bold text-purple-900 text-sm">📱 {BAKERY_PHONE_FORMATTED}</p>
              <p>Monto: S/ {total.toFixed(2)}</p>
            </div>
            <button
              onClick={() => setIsZoomingQr(false)}
              className="w-full py-2.5 bg-stone-900 text-white rounded-xl text-xs font-bold"
            >
              Cerrar Vista
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
