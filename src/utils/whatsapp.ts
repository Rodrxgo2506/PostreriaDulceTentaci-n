import { CartItem, CustomOrder, Dessert } from '../types';
import { BAKERY_NAME, BAKERY_PHONE_NUMBER, BAKERY_PHONE_FORMATTED, BAKERY_ADDRESS, BAKERY_REFERENCE } from '../data/desserts';

export function createWhatsAppUrl(phone: string, message: string): string {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const encodedText = encodeURIComponent(message);
  return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`;
}

export function generateProductOrderWhatsAppMessage(dessert: Dessert, quantity = 1, note = '', orderCode?: string): string {
  const code = orderCode || `DT-${Math.floor(100000 + Math.random() * 900000)}`;
  let message = `🧁 *¡Hola ${BAKERY_NAME}!* 🌸\n\n`;
  message += `Me gustaría realizar un pedido del siguiente postre:\n\n`;
  message += `🧾 *Código de Pedido:* #${code}\n`;
  message += `📌 *Producto:* ${dessert.name}\n`;
  message += `🏷️ *Precio:* S/ ${dessert.price.toFixed(2)}\n`;
  message += `🔢 *Cantidad:* ${quantity} unidad(es)\n`;
  message += `💰 *Total:* S/ ${(dessert.price * quantity).toFixed(2)}\n`;
  
  if (quantity === 1) {
    message += `🏪 *Modalidad:* Recojo en tienda (${BAKERY_ADDRESS} - ${BAKERY_REFERENCE})\n`;
  } else {
    message += `🛵 *Modalidad:* ¡Delivery GRATIS a domicilio (2+ unidades)!\n`;
  }
  
  if (note.trim()) {
    message += `✍️ *Nota o dedicatoria:* "${note.trim()}"\n`;
  }

  message += `\n¿Me confirman la disponibilidad para hoy? ¡Muchas gracias! 💕`;
  return message;
}

export function generateCartOrderWhatsAppMessage(
  items: CartItem[], 
  customerInfo: { name: string; phone: string; address?: string; deliveryType: string; notes?: string },
  deliveryFee = 0,
  orderCode?: string
): string {
  const code = orderCode || `DT-${Math.floor(100000 + Math.random() * 900000)}`;
  const totalQuantity = items.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = items.reduce((acc, item) => acc + item.dessert.price * item.quantity, 0);

  let message = `🌸 *¡Hola ${BAKERY_NAME}! Deseo confirmar mi pedido:* 🍰\n\n`;
  message += `🧾 *Orden N°:* #${code}\n`;
  message += `👤 *Cliente:* ${customerInfo.name || 'Cliente'}\n`;
  message += `📱 *WhatsApp:* ${customerInfo.phone || 'No especificado'}\n`;
  
  if (totalQuantity === 1 || customerInfo.deliveryType === 'pickup') {
    message += `🏪 *Modalidad:* Recojo en Tienda (${BAKERY_ADDRESS} - ${BAKERY_REFERENCE})\n`;
  } else {
    message += `🛵 *Modalidad:* Delivery GRATIS a Domicilio (Promo 2+ unidades)\n`;
    if (customerInfo.address) {
      message += `📍 *Dirección de Entrega:* ${customerInfo.address}\n`;
    }
  }

  message += `\n🛒 *Detalle de Postres:*\n`;
  items.forEach((item, index) => {
    message += `${index + 1}. *${item.dessert.name}* (x${item.quantity}) — S/ ${(item.dessert.price * item.quantity).toFixed(2)}\n`;
    if (item.customDedication) {
      message += `   ✍️ Dedicatoria: "${item.customDedication}"\n`;
    }
  });

  message += `\n🍰 *Total Unidades:* ${totalQuantity}`;
  message += `\n💰 *TOTAL A PAGAR:* S/ ${subtotal.toFixed(2)}\n`;

  if (customerInfo.notes?.trim()) {
    message += `📝 *Indicaciones:* ${customerInfo.notes.trim()}\n`;
  }

  message += `\n¿Me confirman para coordinar? ¡Muchas gracias! 💖`;
  return message;
}

export function sendToWhatsApp(message: string, customPhone = BAKERY_PHONE_NUMBER): void {
  const url = createWhatsAppUrl(customPhone, message);
  window.open(url, '_blank', 'noopener,noreferrer');
}
