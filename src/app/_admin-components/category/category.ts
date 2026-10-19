import { Component } from '@angular/core';
import { CategoryService } from '../../_services/category-service';
import { CategoryDto } from '../../_models/category';

declare const alertify: any;

@Component({
  selector: 'admin-category',
  standalone: false,
  templateUrl: './category.html',
  styleUrl: './category.css'
})
export class Category {

  constructor(private categoryService: CategoryService) {
    this.getCategories();
  }

  categories: CategoryDto[];
  newCategory: CategoryDto = new CategoryDto();
  errors: any = [];   // liste olarak başlıyor

  getCategories() {
    this.categoryService.getCategories().subscribe({
      next: result => this.categories = result.data,
      error: result => console.log(result)
    });
  }

  createCategory() {

    this.categoryService.create(this.newCategory).subscribe({

      next: result => this.getCategories(),

      error: result => {
        alertify.error("Bir Hata Oluştu");

        if (result.status === 400) {         // status Angular'ın hata nesnesinde
          this.errors = result.error.errors;  // hata listesi API'nin cevabında
        }
      },

      complete: () => {
        alertify.success("Kategori eklendi!");

        setTimeout(() => {
          location.reload();
        }, 1000);
      }

    });
  }
}
