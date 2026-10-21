import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../_services/auth-service';
import { CategoryService } from '../../_services/category-service';

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {

  constructor(private authService: AuthService,
              private categoryService: CategoryService) {}

  fullName = '';
  categoryCount: number | null = null;   // null: henüz yüklenmedi

  ngOnInit(): void {
    this.fullName = this.authService.getFullName();

    // Şimdilik sadece kategori sayısını çekebiliyoruz; diğer modüller yapıldıkça eklenecek
    this.categoryService.getCategories().subscribe({
      next: result => this.categoryCount = result.data?.length ?? 0,
      error: () => this.categoryCount = 0
    });
  }

  // Saate göre selamlama
  get greeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Günaydın';
    if (hour < 18) return 'İyi günler';
    return 'İyi akşamlar';
  }
}
