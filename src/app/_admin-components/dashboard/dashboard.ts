import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../_services/auth-service';

// =====================================================================
// GENEL BAKIŞ (admin ana sayfa)
// Şimdilik "yapım aşamasında" ekranı; istatistikler ve grafikler en sona bırakıldı.
// =====================================================================
@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {

  constructor(private authService: AuthService) {}

  firstName = '';
  greeting = '';

  ngOnInit(): void {
    this.firstName = this.authService.getFullName().split(' ')[0] || 'Admin';

    const hour = new Date().getHours();
    this.greeting = hour < 6 ? 'İyi geceler'
                  : hour < 12 ? 'Günaydın'
                  : hour < 18 ? 'İyi günler'
                  : 'İyi akşamlar';
  }
}
