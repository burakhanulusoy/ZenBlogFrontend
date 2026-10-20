import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Result } from '../_models/result';
import { CategoryDto } from '../_models/category';

// =====================================================================
// SERVİS: API ile konuşan TEK yer (backend'deki repository gibi)
// =====================================================================
// Component "kategorileri getir" der; NASIL getirildiğini servis bilir.
// API adresi değişirse sadece burayı değiştirmek yeter.
//
// @Injectable({ providedIn: 'root' }):
//   Uygulama genelinde bu servisten TEK bir tane olur ve isteyen her
//   component'e verilir. Backend'deki AddSingleton'ın karşılığı.
//   Bu sayede AppModule'e ayrıca kaydetmeye gerek kalmaz.

@Injectable({
  providedIn: 'root'
})
export class CategoryService {

  // Bütün isteklerin başlangıç adresi (hocada port 7000, bizim API'mizde 7200).
  // Sonundaki "/" sayesinde delete'te baseUrl + id doğru adresi oluşturur.
  baseUrl = "https://localhost:7200/api/categories/";

  // HttpClient: Angular'ın API'ye istek atan aracı.
  // Constructor'dan alınması = dependency injection (handler'lara IRepository almak gibi).
  // Kullanılabilmesi için AppModule'de provideHttpClient(...) olmalı.
  constructor(private http: HttpClient) {}

  // ÖNEMLİ: Bu metotların hiçbiri isteği GÖNDERMEZ.
  // Sadece isteği hazırlayıp bir Observable döndürür.
  // İstek, component'te .subscribe(...) dendiği AN gider
  // (C#'ta Task döndüren metodu await etmek gibi).

  // GET /api/categories/ → tüm kategoriler
  // <Result<CategoryDto[]>>: "cevap, içinde kategori listesi olan bir BaseResult olacak"
  // Böylece component'te result.data yazınca editör ne olduğunu bilir.
  getCategories() {
    return this.http.get<Result<CategoryDto[]>>(this.baseUrl);
  }

  // POST /api/categories/ → yeni kategori
  // İkinci parametre isteğin GÖVDESİ; Angular onu JSON'a çevirir:
  //   { "name": "Yazılım" }  →  backend'de CreateCategoryCommand(string Name) karşılar
  create(categoryDto: CategoryDto) {
    return this.http.post<Result<CategoryDto>>(this.baseUrl, categoryDto);
  }

  // DELETE /api/categories/{id}
  // Backend'deki MapDelete("{id:guid}") ile eşleşir.
  delete(id: string) {
    return this.http.delete(this.baseUrl + id);
  }

  // PUT /api/categories/ → güncelleme
  // Gövde: { "id": "...", "name": "Yeni İsim" }
  // Backend'de UpdateCategoryCommand(Guid Id, string Name) karşılar.
  update(model: CategoryDto) {
    return this.http.put(this.baseUrl, model);
  }

}
