import { Injectable } from '@angular/core';
import Swal from 'sweetalert2';

// confirm() metoduna verilecek ayarlar
export interface ConfirmOptions {
  title: string;           // büyük başlık: "Blog silinsin mi?"
  text?: string;           // altındaki açıklama
  confirmText?: string;    // onay butonu: "Evet, sil"
  cancelText?: string;     // vazgeç butonu
  danger?: boolean;        // true → kırmızı buton + uyarı ikonu (silme gibi geri alınamaz işler)
}

// =====================================================================
// SWEETALERT SERVİSİ
// Bütün onay pencereleri ve bildirimler buradan geçiyor; görünüm tek yerden yönetiliyor.
// Stiller: styles.css → "SWEETALERT2" bölümü
// =====================================================================
@Injectable({
  providedIn: 'root',
})
export class SweetAlert {

  // Sağ üstte çıkıp kendiliğinden kapanan küçük bildirim şablonu.
  // mixin: ortak ayarları bir kere verip tekrar tekrar kullanmak için (C#'taki varsayılan parametreler gibi)
  private toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 2600,
    timerProgressBar: true,
    customClass: { popup: 'zb-swal-toast' }
  });

  // ONAY PENCERESİ: kullanıcı "Evet"e basarsa true, vazgeçerse ya da kapatırsa false
  // Promise<boolean>: "ileride true ya da false döneceğim" sözü → await ile bekleniyor
  confirm(options: ConfirmOptions): Promise<boolean> {
    return Swal.fire({
      title: options.title,
      text: options.text,
      icon: options.danger ? 'warning' : 'question',
      iconColor: options.danger ? '#dc2626' : 'var(--p-primary-600)',
      showCancelButton: true,
      reverseButtons: true,               // Vazgeç solda, onay sağda
      focusCancel: !!options.danger,      // tehlikeli işlemde Enter'a basılırsa yanlışlıkla silinmesin
      confirmButtonText: options.confirmText ?? 'Evet',
      cancelButtonText: options.cancelText ?? 'Vazgeç',
      buttonsStyling: false,              // SweetAlert'in kendi buton stilleri yerine bizimkiler
      customClass: {
        popup: 'zb-swal',
        actions: 'zb-swal-actions',
        confirmButton: options.danger ? 'zb-swal-btn zb-swal-danger' : 'zb-swal-btn zb-swal-confirm',
        cancelButton: 'zb-swal-btn zb-swal-cancel'
      }
    }).then(result => result.isConfirmed);
  }

  // Eski kullanım (Kategoriler, Bloglarım): genel silme onayı
  areYouSure(): Promise<boolean> {
    return this.confirm({
      title: 'Emin misiniz?',
      text: 'Bu işlem geri alınamaz.',
      confirmText: 'Evet, sil',
      danger: true
    });
  }

  // Başarılı bildirim: "Blog silindi"
  success(title: string, text?: string) {
    this.toast.fire({ icon: 'success', title, text });
  }

  // Hata bildirimi (biraz daha uzun ekranda kalır ki okunabilsin)
  error(title: string, text?: string) {
    this.toast.fire({ icon: 'error', title, text, timer: 4500 });
  }
}
