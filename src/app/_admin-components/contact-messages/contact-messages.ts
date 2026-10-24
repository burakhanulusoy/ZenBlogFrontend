import { Component, OnInit } from '@angular/core';
import { ContactMessageService } from '../../_services/contact-message-service';
import { SweetAlert } from '../../_services/sweet-alert';
import { ContactMessageDto, MESSAGE_STATUS_LABELS, MessageStatus } from '../../_models/contact';

type Tab = 'all' | MessageStatus;

// =====================================================================
// GELEN MESAJLAR (sadece Admin) · e-posta programı düzeni
// Solda liste, sağda okuma paneli. Mesaj açılınca backend "Okundu" yapar.
// =====================================================================
@Component({
  selector: 'app-contact-messages',
  standalone: false,
  templateUrl: './contact-messages.html',
  styleUrl: './contact-messages.css'
})
export class ContactMessages implements OnInit {

  constructor(private messageService: ContactMessageService,
              private swal: SweetAlert) {}

  // Şablonda enum'u kullanabilmek için (MessageStatus.Pending gibi)
  readonly Status = MessageStatus;

  messages: ContactMessageDto[] = [];
  filtered: ContactMessageDto[] = [];
  tab: Tab = 'all';
  searchText = '';

  isLoading = true;
  errorMessage = '';

  selected: ContactMessageDto | null = null;
  isLoadingDetail = false;

  readonly tabs: { value: Tab; label: string; icon: string }[] = [
    { value: 'all', label: 'Tümü', icon: 'pi pi-inbox' },
    { value: MessageStatus.Pending, label: 'Okunmadı', icon: 'pi pi-envelope' },
    { value: MessageStatus.Read, label: 'Okundu', icon: 'pi pi-eye' },
    { value: MessageStatus.Replied, label: 'Yanıtlandı', icon: 'pi pi-reply' },
    { value: MessageStatus.Irrelevant, label: 'Gereksiz', icon: 'pi pi-ban' }
  ];

  ngOnInit(): void {
    this.load();
  }

  load() {
    this.isLoading = true;
    this.errorMessage = '';

    this.messageService.getAll().subscribe({
      next: result => {
        this.messages = result.data ?? [];
        this.applyFilter();
        this.isLoading = false;
      },
      error: err => {
        this.isLoading = false;
        this.errorMessage = err.error?.errors?.[0]?.errorMessage ?? "Mesajlar yüklenemedi.";
      }
    });
  }

  count(tab: Tab): number {
    return tab === 'all' ? this.messages.length : this.messages.filter(m => m.contactMessageStatus === tab).length;
  }

  setTab(tab: Tab) {
    this.tab = tab;
    this.applyFilter();
  }

  onSearch(value: string) {
    this.searchText = value;
    this.applyFilter();
  }

  // Sekme + arama (ad, e-posta, konu)
  applyFilter() {
    const q = this.searchText.trim().toLocaleLowerCase('tr');
    this.filtered = this.messages.filter(m =>
      (this.tab === 'all' || m.contactMessageStatus === this.tab) &&
      (!q || m.name.toLocaleLowerCase('tr').includes(q)
          || m.email.toLocaleLowerCase('tr').includes(q)
          || m.subject.toLocaleLowerCase('tr').includes(q)));
  }

  statusLabel(status: MessageStatus): string {
    return MESSAGE_STATUS_LABELS[status] ?? '';
  }

  initials(name: string): string {
    return name.split(' ').filter(p => p).map(p => p[0].toLocaleUpperCase('tr')).slice(0, 2).join('');
  }

  // ---------------------------------------------------------------
  // MESAJI AÇ (backend "Okunmadı" ise "Okundu" yapıyor)
  // ---------------------------------------------------------------
  open(message: ContactMessageDto) {
    this.isLoadingDetail = true;

    this.messageService.getById(message.id).subscribe({
      next: result => {
        this.selected = result.data;
        this.isLoadingDetail = false;

        // Listedeki satırın durumunu da güncelle (yeniden yüklemeden)
        message.contactMessageStatus = result.data.contactMessageStatus;
        this.applyFilter();
      },
      error: () => {
        this.isLoadingDetail = false;
        this.swal.error('Mesaj açılamadı');
      }
    });
  }

  closeDetail() {
    this.selected = null;
  }

  // ---------------------------------------------------------------
  // DURUM DEĞİŞTİR
  // ---------------------------------------------------------------
  setStatus(status: MessageStatus) {
    if (!this.selected) return;
    const target = this.selected;

    this.messageService.updateStatus(target.id, status).subscribe({
      next: () => {
        target.contactMessageStatus = status;
        const row = this.messages.find(m => m.id === target.id);
        if (row) row.contactMessageStatus = status;
        this.applyFilter();
        this.swal.success(`"${this.statusLabel(status)}" olarak işaretlendi`);
      },
      error: err => this.swal.error('Güncellenemedi', err.error?.errors?.[0]?.errorMessage)
    });
  }

  // "E-postayla yanıtla": kişinin e-posta programını "Re: konu" ile açar
  // encodeURIComponent: Türkçe karakter ve boşlukları adres içinde güvenli hale getirir
  get replyLink(): string {
    if (!this.selected) return '';
    return `mailto:${this.selected.email}?subject=${encodeURIComponent('Re: ' + this.selected.subject)}`;
  }

  // ---------------------------------------------------------------
  // SİL
  // ---------------------------------------------------------------
  async deleteSelected() {
    if (!this.selected) return;
    const target = this.selected;

    const confirmed = await this.swal.confirm({
      title: 'Mesaj silinsin mi?',
      text: `${target.name} adlı kişinin "${target.subject}" konulu mesajı silinecek.`,
      confirmText: 'Evet, sil',
      danger: true
    });
    if (!confirmed) return;

    this.messageService.delete(target.id).subscribe({
      next: () => {
        this.messages = this.messages.filter(m => m.id !== target.id);
        this.applyFilter();
        this.selected = null;
        this.swal.success('Mesaj silindi');
      },
      error: err => this.swal.error('Silinemedi', err.error?.errors?.[0]?.errorMessage)
    });
  }
}
