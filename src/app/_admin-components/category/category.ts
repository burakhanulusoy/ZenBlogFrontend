import { SweetAlert } from './../../_services/sweet-alert';
import { Component } from '@angular/core';
import { CategoryService } from '../../_services/category-service';
import { CategoryDto } from '../../_models/category';

// alertify, Angular'ın değil; angular.json'daki "scripts" ile sayfaya eklenen
// düz bir JavaScript kütüphanesi. TypeScript onu tanımadığı için
// "bu isimde bir şey var, tipine karışma" diyoruz.
// Bu satır olmazsa alertify.success(...) satırları kırmızı çizilir.
declare const alertify: any;

// =====================================================================
// COMPONENT: sayfanın BEYNİ
// =====================================================================
// Verileri tutar, butonlara basılınca ne olacağını belirler.
// Üç dosyadan oluşur: .ts (mantık), .html (görünüm), .css (stil).
//
// selector:    HTML'de <admin-category> olarak kullanılabilir.
// standalone:  false → NgModule yapısında; AppModule'ün declarations'ına kayıtlı olmalı.

@Component({
  selector: 'admin-category',
  standalone: false,
  templateUrl: './category.html',
  styleUrl: './category.css'
})
export class Category {

  // İki servis DI ile alınıyor; sayfa açılır açılmaz kategoriler yükleniyor.
  constructor(private categoryService: CategoryService,
              private swal: SweetAlert) {

    this.getCategories();

  }

  // ---------------------------------------------------------------
  // VERİLER (her birinin HTML'de bir karşılığı var)
  // ---------------------------------------------------------------

  // Tablodaki liste → HTML'de *ngFor="let item of categories"
  categories: CategoryDto[];

  // Ekleme formunun verisi → HTML'de [(ngModel)]="newCategory.name"
  // Baştan new CategoryDto() veriyoruz: sayfa açılınca HTML newCategory.name'i
  // okumaya çalışıyor; boş olsaydı "undefined'ın name'i okunamaz" hatası çıkardı.
  newCategory: CategoryDto = new CategoryDto();

  // Güncelleme formunun verisi → HTML'de [(ngModel)]="editCategory.name"
  // Aynı sebeple baştan boş nesne {} veriyoruz.
  editCategory: any = {};

  // API'den gelen validation hataları → input altındaki kırmızı yazılar
  // Liste olarak başlıyor çünkü API hataları liste halinde dönüyor:
  //   [ { propertyName: "Name", errorMessage: "Kategori adı boş olamaz." } ]
  errors: any = [];


  // ---------------------------------------------------------------
  // LİSTELE
  // ---------------------------------------------------------------
  getCategories() {
    // subscribe: isteği GÖNDERİR ve cevap gelince ne yapılacağını tanımlar.
    this.categoryService.getCategories().subscribe({

      // next: cevap BAŞARILI (2xx) gelince çalışır.
      // result = API'nin döndüğü BaseResult → { data: [...], errors: [], isSuccessful: true }
      // Listeyi categories'e yazınca ekran kendiliğinden güncellenir (zone.js sayesinde).
      next: result => this.categories = result.data,

      // error: cevap HATALI (4xx/5xx) gelince çalışır.
      error: result => console.log(result)
    });
  }


  // ---------------------------------------------------------------
  // EKLE
  // ---------------------------------------------------------------
  // Kullanıcı inputa yazdıkça newCategory.name doluyor (two-way binding);
  // Kaydet'e basınca bu metot çalışıp newCategory'yi API'ye gönderiyor.
  createCategory() {

    this.categoryService.create(this.newCategory).subscribe({

      // Hocanın kodunda burada this.categories.push(result.data) vardı.
      // Bizim API eklenen kategoriyi geri DÖNMÜYOR (cevap gövdesi boş, result null);
      // push(result.data) "null'ın data'sı okunamaz" hatası verirdi.
      // Bu yüzden listeyi baştan yeniden çekiyoruz.
      next: result => this.getCategories(),

      error: result => {
        // Sağ altta kırmızı bildirim
        alertify.error("Bir Hata Oluştu");

        // result = Angular'ın hata nesnesi (HttpErrorResponse):
        //   result.status        → durum kodu (400, 401, 500...)
        //   result.error         → API'nin gönderdiği BaseResult
        //   result.error.errors  → hata listesi
        // 400 = validation hatası → mesajları input altında göstermek için errors'a koy
        if (result.status === 400) {
          this.errors = result.error.errors;
        }
      },

      // complete: next'ten SONRA, işlem başarıyla BİTTİĞİNDE çalışır.
      // Hata olursa next de complete de çalışmaz, sadece error çalışır.
      complete: () => {
        alertify.success("Kategori eklendi!");

        // Bildirimin görünmesi için 1 saniye bekleyip sayfayı yeniliyoruz.
        // Yenileme modalı kapatmış ve formu temizlemiş oluyor.
        setTimeout(() => {
          location.reload();
        }, 1000);
      }

    });
  }


  // ---------------------------------------------------------------
  // SİL
  // ---------------------------------------------------------------
  // async: metodun içinde await kullanabilmek için şart (C#'taki async gibi).
  async delete(id: string) {

    // "Emin misiniz?" penceresini açar ve kullanıcının cevabını BEKLER.
    // areYouSure() bir Promise<boolean> döndürüyor: "ileride true/false vereceğim" sözü.
    // C#: var ok = await SorAsync();  ile aynı mantık.
    const isConfirmed = await this.swal.areYouSure();

    // Sadece "Evet" denirse silme isteği gider.
    if (isConfirmed) {
      this.categoryService.delete(id).subscribe({

        error: result => {
          console.log(result.error.errors);
          alertify.error("Kategori silinemedi!");
        },

        // Silme bitince listeyi yeniden çekiyoruz; silinen kategori tablodan kaybolur.
        // Açık bir modal olmadığı için sayfayı yenilemeye gerek yok.
        complete: () => {
          alertify.success("Kategori silindi");
          this.getCategories();
        }
      });
    }
  }


  // ---------------------------------------------------------------
  // GÜNCELLE
  // ---------------------------------------------------------------
  // Modalda Kaydet'e basınca çalışır.
  // editCategory'de { id, name } var → backend'deki UpdateCategoryCommand ile birebir uyuşur.
  update() {

    this.categoryService.update(this.editCategory).subscribe({

      // API başarılı olunca boş bir Ok() döndüğü için next yazmadık; complete yeterli.

      error: result => {
        alertify.error("Bir Hata Oluştu");

        if (result.status === 400) {
          this.errors = result.error.errors;
        }
      },

      complete: () => {
        alertify.success("Kategori güncellendi!");

        setTimeout(() => {
          location.reload();
        }, 1000);
      }

    });
  }

  // Tablodaki "Güncelle" butonuna basınca çalışır:
  // o satırın kategorisini güncelleme formuna aktarır.
  onSelected(model: CategoryDto) {

    // { ...model } (spread): nesnenin KOPYASINI oluşturur.
    // Hoca "this.editCategory = model" yazıyor: o zaman editCategory ile tablodaki satır
    // AYNI nesne olur; modalda yazdıkça tablodaki isim de anında değişir ve
    // "Kapat"a basılsa bile yanlış isim ekranda kalır.
    // Kopya alınca, kaydedilene kadar tablo etkilenmez.
    this.editCategory = { ...model };

    // Create ve update aynı errors değişkenini kullanıyor;
    // ekleme modalında kalan eski bir hata, güncelleme modalında görünmesin.
    this.errors = [];
  }

}
