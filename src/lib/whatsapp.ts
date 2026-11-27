/**
 * Normaliza un teléfono argentino al formato internacional de WhatsApp (549 + área + número).
 * Acepta "351 15 123-4567", "0351 1234567", "+54 9 351 1234567", etc.
 * (El servidor usa la misma lógica en api/_lib/whatsapp.js.)
 */
export function toWhatsappNumber(raw: string | null | undefined): string {
  let d = (raw ?? '').replace(/\D/g, '');
  if (!d) return '';
  if (d.startsWith('54')) {
    d = d.slice(2);
    if (d.startsWith('9')) d = d.slice(1);
  }
  if (d.startsWith('0')) d = d.slice(1);
  // Quitar el "15" de celular que va después del código de área (2 a 4 dígitos)
  if (d.length === 12) {
    for (const areaLen of [2, 3, 4]) {
      if (d.slice(areaLen, areaLen + 2) === '15') { d = d.slice(0, areaLen) + d.slice(areaLen + 2); break; }
    }
  }
  return d.length === 10 ? `549${d}` : d;
}

/** Link wa.me que abre WhatsApp con el mensaje escrito (envío manual, sin API). */
export function waLink(phone: string | null | undefined, text: string) {
  return `https://wa.me/${toWhatsappNumber(phone)}?text=${encodeURIComponent(text)}`;
}
