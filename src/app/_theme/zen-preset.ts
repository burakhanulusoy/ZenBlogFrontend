import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

// =====================================================================
// ZENBLOG TEMASI
// PrimeNG'nin hazır "Aura" temasını temel alıp ana rengini değiştiriyoruz.
// (C#'ta bir base class'tan türetip sadece bir property'yi override etmek gibi.)
//
// primary: butonlar, seçili menü, odak çizgisi gibi her yerde kullanılan ana renk.
// '{emerald.500}' → PrimeNG'nin kendi renk paletindeki zümrüt yeşili tonları.
// 50 en açık, 950 en koyu ton; bileşenler ihtiyaç duydukları tonu buradan alıyor.
// =====================================================================
export const ZenPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '{emerald.50}',
      100: '{emerald.100}',
      200: '{emerald.200}',
      300: '{emerald.300}',
      400: '{emerald.400}',
      500: '{emerald.500}',
      600: '{emerald.600}',
      700: '{emerald.700}',
      800: '{emerald.800}',
      900: '{emerald.900}',
      950: '{emerald.950}'
    }
  }
});
