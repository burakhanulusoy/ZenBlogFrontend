import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../_services/auth-service';
import { BlogService } from '../../_services/blog-service';
import { BlogListDto } from '../../_models/blogListDto';

@Component({
  selector: 'app-writer-dashboard',
  standalone: false,
  templateUrl: './writer-dashboard.html',
  styleUrl: './writer-dashboard.css'
})
export class WriterDashboard implements OnInit {

  constructor(private authService: AuthService,
              private blogService: BlogService) {}

  fullName = '';
  myBlogs: BlogListDto[] = [];
  isLoading = true;
  errorMessage = '';

  ngOnInit(): void {
    this.fullName = this.authService.getFullName();

    this.blogService.getMyBlogs().subscribe({
      next: result => {
        // En yeni bloglar üstte olsun (LINQ: OrderByDescending)
        this.myBlogs = (result.data ?? [])
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        this.isLoading = false;
      },
      error: err => {
        this.isLoading = false;
        // Not: Backend'de genel kural şimdilik AdminOnly olduğu için Writer burada 403 alır;
        // izinleri en sonda açınca veriler gelecek.
        this.errorMessage = err.status === 403
          ? "Bloglarına şu an erişilemiyor (yetki ayarları henüz tamamlanmadı)."
          : err.error?.errors?.[0]?.errorMessage ?? "Bloglar yüklenemedi.";
      }
    });
  }

  // Son 5 blog (LINQ: Take(5))
  get recentBlogs(): BlogListDto[] {
    return this.myBlogs.slice(0, 5);
  }

  // Bu ay yazılan blog sayısı (LINQ: Where + Count)
  get thisMonthCount(): number {
    const now = new Date();
    return this.myBlogs.filter(b => {
      const d = new Date(b.createdAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
  }

  // Saate göre selamlama
  get greeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Günaydın';
    if (hour < 18) return 'İyi günler';
    return 'İyi akşamlar';
  }
}
