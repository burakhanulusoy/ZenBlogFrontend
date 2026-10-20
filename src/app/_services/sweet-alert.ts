import { Injectable } from '@angular/core';
import Swal, { SweetAlertResult } from 'sweetalert2';

@Injectable({
  providedIn: 'root',
})
export class SweetAlert {

  // Promise<boolean>: "ileride true ya da false döneceğim" sözü
  areYouSure(): Promise<boolean> {
    return Swal.fire({
      title: "Emin misiniz?",
      text: "Bu işlem geri alınamaz!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Evet, sil!",
      cancelButtonText: "Vazgeç"
    }).then((result: SweetAlertResult) => {
      // Kullanıcı "Evet"e bastıysa true, "Vazgeç"e bastıysa ya da pencereyi kapattıysa false
      return result.isConfirmed;
    });
  }
}
