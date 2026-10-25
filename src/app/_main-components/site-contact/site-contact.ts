import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Subscription } from 'rxjs';
import { SiteService } from '../../_services/site-service';
import { ContactMessageService } from '../../_services/contact-message-service';
import { AuthService } from '../../_services/auth-service';
import { Turnstile } from '../../_shared-components/turnstile/turnstile';
import { ApiError } from '../../_models/result';
import { ContactDto } from '../../_models/contact';
import { SocialMediaDto } from '../../_models/site-content';

// =====================================================================
// SİTE: İLETİŞİM  →  /contact
// Büyük harita + iletişim bilgileri + mesaj formu (Turnstile korumalı).
// İletişim ve sosyal medya SiteService'ten (önbellekli; footer zaten yüklüyor).
// =====================================================================
@Component({
  selector: 'app-site-contact',
  standalone: false,
  templateUrl: './site-contact.html',
  styleUrl: './site-contact.css'
})
export class SiteContact implements OnInit, OnDestroy {

  constructor(private siteService: SiteService,
              private messageService: ContactMessageService,
              private authService: AuthService,
              private sanitizer: DomSanitizer) {}

  // Gönderim başarısız olursa doğrulama kutucuğunu sıfırlamak için
  @ViewChild(Turnstile) turnstile?: Turnstile;

  contact: ContactDto | null = null;
  socials: SocialMediaDto[] = [];
  mapUrl: SafeResourceUrl | null = null;   // BİR KEZ hesaplanır (iframe sürekli yenilenmesin)

  // FORM (backend validator sınırlarıyla aynı)
  form = { name: '', email: '', subject: '', messageBody: '' };
  readonly limits = { name: 100, subject: 150, messageMin: 10, messageMax: 2000 };

  turnstileToken: string | null = null;
  isSending = false;
  isSent = false;
  submitted = false;
  errors: ApiError[] = [];
  generalError = '';

  private subscriptions = new Subscription();
  private readonly mapPrefix = 'https://www.google.com/maps/embed';

  ngOnInit(): void {
    this.subscriptions.add(
      this.siteService.getContact().subscribe(contact => {
        this.contact = contact;
        // Güvenlik: sadece Google Haritalar yerleştirme adresi iframe'e konur
        this.mapUrl = contact?.mapLocationUrl?.startsWith(this.mapPrefix)
          ? this.sanitizer.bypassSecurityTrustResourceUrl(contact.mapLocationUrl)
          : null;
      })
    );

    this.subscriptions.add(this.siteService.getSocials().subscribe(s => this.socials = s));

    this.prefillFromUser();
  }

  // Giriş yapmışsa ad ve e-posta hazır gelsin
  private prefillFromUser() {
    if (this.authService.loggedIn()) {
      this.form.name = this.authService.getFullName();
      this.form.email = this.authService.getEmail();
    }
  }

  get messageLength(): number {
    return this.form.messageBody.trim().length;
  }

  fieldError(field: string): string | undefined {
    return this.errors.find(e => e.propertyName === field)?.errorMessage;
  }

  // ---------------------------------------------------------------
  // GÖNDER
  // ---------------------------------------------------------------
  send(contactForm: NgForm) {
    this.submitted = true;
    this.generalError = '';

    if (contactForm.invalid || this.messageLength < this.limits.messageMin || !this.turnstileToken) {
      contactForm.control.markAllAsTouched();
      return;
    }

    this.isSending = true;
    this.errors = [];

    this.messageService.send({
      name: this.form.name.trim(),
      email: this.form.email.trim(),
      subject: this.form.subject.trim(),
      messageBody: this.form.messageBody.trim()
    }, this.turnstileToken).subscribe({
      next: () => {
        this.isSending = false;
        this.isSent = true;
      },
      error: err => {
        this.isSending = false;
        this.turnstile?.reset();   // token tek kullanımlık; yeniden doğrulansın

        if (err.status === 429) {
          this.generalError = 'Çok kısa sürede fazla mesaj gönderildi. Lütfen birkaç dakika sonra tekrar deneyin.';
        } else if (err.status === 400 && err.error?.errors) {
          this.errors = err.error.errors;
          const general = this.errors.find(e => !['Name', 'Email', 'Subject', 'MessageBody'].includes(e.propertyName));
          if (general) this.generalError = general.errorMessage;
        } else {
          this.generalError = 'Mesaj gönderilemedi. Lütfen daha sonra tekrar deneyin.';
        }
      }
    });
  }

  newMessage() {
    this.isSent = false;
    this.submitted = false;
    this.errors = [];
    this.generalError = '';
    this.turnstileToken = null;
    this.form = { name: '', email: '', subject: '', messageBody: '' };
    this.prefillFromUser();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
