import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ContactService } from '../../_services/contact-service';
import { SweetAlert } from '../../_services/sweet-alert';
import { ApiError } from '../../_models/result';
import { ContactDto } from '../../_models/contact';

// =====================================================================
// İLETİŞİM BİLGİLERİ (sadece Admin, Site içeriği)
// Ayarlar sayfası gibi TEK form: kayıt yoksa oluşturur, varsa günceller.
// Sitede en son kayıt kullanılıyor.
// =====================================================================
@Component({
  selector: 'app-contact-info',
  standalone: false,
  templateUrl: './contact-info.html',
  styleUrl: './contact-info.css'
})
export class ContactInfo implements OnInit {

  // DomSanitizer: Angular'ın güvenlik kapısı. <iframe [src]> için adres "güvenli" diye işaretlenmeli.
  constructor(private contactService: ContactService,
              private swal: SweetAlert,
              private sanitizer: DomSanitizer) {}

  contact: ContactDto | null = null;   // mevcut kayıt (yoksa null)
  form = { mapLocationUrl: '', address: '', phoneNumber: '', email: '' };
  private original = { ...this.form };

  errors: ApiError[] = [];
  isLoading = true;
  isSaving = false;
  errorMessage = '';

  // Harita önizlemesi: SADECE adres değişince yeniden hesaplanır.
  // (Getter olsaydı her ekran yenilemesinde yeni bir nesne üretir, iframe sürekli yeniden yüklenirdi.)
  mapPreview: SafeResourceUrl | null = null;

  readonly mapPrefix = 'https://www.google.com/maps/embed';

  ngOnInit(): void {
    this.load();
  }

  load() {
    this.isLoading = true;
    this.errorMessage = '';

    this.contactService.getAll().subscribe({
      next: result => {
        this.contact = result.data?.[0] ?? null;
        this.form = {
          mapLocationUrl: this.contact?.mapLocationUrl ?? '',
          address: this.contact?.address ?? '',
          phoneNumber: this.contact?.phoneNumber ?? '',
          email: this.contact?.email ?? ''
        };
        this.original = { ...this.form };
        this.updateMapPreview();
        this.isLoading = false;
      },
      error: err => {
        this.isLoading = false;
        this.errorMessage = err.error?.errors?.[0]?.errorMessage ?? "İletişim bilgileri yüklenemedi.";
      }
    });
  }

  // Kullanıcı haritanın tamamını (<iframe src="..."> kodunu) yapıştırırsa
  // içinden sadece adresi ayıkla; bu, en sık yapılan hata
  onMapInput(value: string) {
    const match = value.match(/src="([^"]+)"/);
    this.form.mapLocationUrl = (match ? match[1] : value).trim();
    this.updateMapPreview();
  }

  private updateMapPreview() {
    const url = this.form.mapLocationUrl;
    this.mapPreview = url.startsWith(this.mapPrefix)
      ? this.sanitizer.bypassSecurityTrustResourceUrl(url)   // önek kontrolünden geçtiği için güvenli
      : null;
  }

  get isMapValid(): boolean {
    return this.form.mapLocationUrl.startsWith(this.mapPrefix);
  }

  get hasChanges(): boolean {
    return JSON.stringify(this.form) !== JSON.stringify(this.original);
  }

  fieldError(field: string): string | undefined {
    return this.errors.find(e => e.propertyName === field)?.errorMessage;
  }

  save(contactForm: NgForm) {
    if (contactForm.invalid || !this.isMapValid) {
      contactForm.control.markAllAsTouched();
      this.swal.error("Eksik alanlar var", "Kırmızı işaretli alanları düzelt.");
      return;
    }

    this.isSaving = true;
    this.errors = [];

    const dto = {
      mapLocationUrl: this.form.mapLocationUrl.trim(),
      address: this.form.address.trim(),
      phoneNumber: this.form.phoneNumber.trim(),
      email: this.form.email.trim()
    };

    // Kayıt varsa güncelle, yoksa oluştur
    const request = this.contact
      ? this.contactService.update({ id: this.contact.id, ...dto })
      : this.contactService.create(dto);

    request.subscribe({
      next: () => {
        this.isSaving = false;
        this.swal.success('İletişim bilgileri kaydedildi', 'Sitede hemen güncellendi.');
        this.load();
      },
      error: err => {
        this.isSaving = false;
        if (err.status === 400 && err.error?.errors) {
          this.errors = err.error.errors;
        } else {
          this.swal.error("Kaydedilemedi", err.error?.errorMessage ?? `Durum kodu: ${err.status}`);
        }
      }
    });
  }

  reset() {
    this.form = { ...this.original };
    this.errors = [];
    this.updateMapPreview();
  }
}
