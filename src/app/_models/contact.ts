// İletişim bilgisi (sitede en son eklenen kullanılır)
export class ContactDto {
  id: string;
  mapLocationUrl: string;   // Google Haritalar "yerleştir" adresi
  address: string;
  phoneNumber: string;
  email: string;
}

// Mesaj durumu (backend'deki ContactMessageStatus enum'u: JSON'da SAYI olarak geliyor)
export enum MessageStatus {
  Pending = 1,      // Bekliyor (okunmadı)
  Read = 2,         // Okundu
  Irrelevant = 3,   // Gereksiz
  Replied = 4       // Yanıtlandı
}

export const MESSAGE_STATUS_LABELS: Record<number, string> = {
  1: 'Okunmadı',
  2: 'Okundu',
  3: 'Gereksiz',
  4: 'Yanıtlandı'
};

// Gelen mesaj
export class ContactMessageDto {
  id: string;
  name: string;
  email: string;
  subject: string;
  messageBody: string;
  contactMessageStatus: MessageStatus;
  createdAt: string;
}
