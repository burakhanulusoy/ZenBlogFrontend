import { Component } from '@angular/core';
import { AuthService } from '../../_services/auth-service';

@Component({
  selector: 'main-layout',
  standalone: false,
  styleUrl: './main-layout.css',
  templateUrl: './main-layout.html',
})
export class MainLayout {

  // public: HTML'de authService.loggedIn() ve authService.logout() kullanabilmek için
  constructor(public authService: AuthService) {}
}
