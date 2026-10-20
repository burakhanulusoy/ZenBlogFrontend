// =====================================================================
// MODEL: API'den gelen bir kategorinin ŞEKLİ
// =====================================================================
// Backend'deki GetCategoriesQueryResult(Guid Id, string Name)'in karşılığı.
// Alan adları API'nin döndüğü JSON ile BİREBİR aynı olmalı:
//   API → { "id": "...", "name": "Yazılım" }
// Hocanın kodunda "categoryName" yazıyor; bizim API "name" döndüğü için "name".
// Guid'ler JavaScript'te string olarak gelir.

export class CategoryDto {

  id;
  name;

}
