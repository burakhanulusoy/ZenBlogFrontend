import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription, filter } from 'rxjs';
import { AuthService } from '../../_services/auth-service';

declare const bootstrap: any;

@Component({
  selector: 'app-writer-layout',
  standalone: false,
  templateUrl: './writer-layout.html',
  // Admin paneliyle aynı tasarım: CSS'i ortak kullanıyoruz
  styleUrl: '../admin-layout/admin-layout.css'
})
export class WriterLayout implements OnInit, OnDestroy {

  constructor(public authService: AuthService,
              private router: Router) {}

  fullName = '';
  private routerSubscription: Subscription;

  ngOnInit(): void {
    this.fullName = this.authService.getFullName();

    // Mobilde sayfa değişince açık yan menüyü kapat
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        const sidebar = document.getElementById('writerSidebar');
        bootstrap.Offcanvas.getInstance(sidebar)?.hide();
      });
  }

  get initials(): string {
    return this.fullName
      .split(' ')
      .filter(part => part)
      .map(part => part[0].toUpperCase())
      .slice(0, 2)
      .join('');
  }

  ngOnDestroy(): void {
    this.routerSubscription?.unsubscribe();
  }
}
