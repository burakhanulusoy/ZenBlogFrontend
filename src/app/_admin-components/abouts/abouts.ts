import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AboutService } from '../../_services/about-service';
import { SweetAlert } from '../../_services/sweet-alert';
import { AboutDto } from '../../_models/site-content';

// =====================================================================
// HAKKIMIZDA (sadece Admin, Site içeriği)
// En SON eklenen içerik sitede yayında; diğerleri önceki sürüm olarak durur.
// Backend listeyi en yeni en üstte döndürüyor → [0] yayındaki.
// =====================================================================
@Component({
  selector: 'app-abouts',
  standalone: false,
  templateUrl: './abouts.html',
  styleUrl: './abouts.css'
})
export class Abouts implements OnInit {

  constructor(private aboutService: AboutService,
              private swal: SweetAlert,
              private router: Router,
              private route: ActivatedRoute) {}

  abouts: AboutDto[] = [];
  isLoading = true;
  errorMessage = '';

  ngOnInit(): void {
    this.load();
  }

  load() {
    this.isLoading = true;
    this.errorMessage = '';

    this.aboutService.getAll().subscribe({
      next: result => {
        this.abouts = result.data ?? [];
        this.isLoading = false;
      },
      error: err => {
        this.isLoading = false;
        this.errorMessage = err.error?.errors?.[0]?.errorMessage ?? "Hakkımızda içerikleri yüklenemedi.";
      }
    });
  }

  // Sitede yayında olan (en yeni)
  get published(): AboutDto | null {
    return this.abouts[0] ?? null;
  }

  // Önceki sürümler
  get history(): AboutDto[] {
    return this.abouts.slice(1);
  }

  goToNew() {
    this.router.navigate(['new'], { relativeTo: this.route });
  }

  edit(about: AboutDto) {
    this.router.navigate(['edit', about.id], { relativeTo: this.route });
  }

  async deleteAbout(about: AboutDto) {
    const isPublished = about.id === this.published?.id;

    const confirmed = await this.swal.confirm({
      title: 'İçerik silinsin mi?',
      text: isPublished
        ? (this.history.length > 0
            ? 'Bu içerik şu an yayında. Silersen bir önceki sürüm otomatik olarak yayına geçecek.'
            : 'Bu içerik şu an yayında ve başka sürüm yok. Silersen sitede Hakkımızda bölümü boş görünecek.')
        : 'Bu önceki sürüm kalıcı olarak listeden kaldırılacak.',
      confirmText: 'Evet, sil',
      danger: true
    });
    if (!confirmed) return;

    this.aboutService.delete(about.id).subscribe({
      next: () => {
        this.swal.success('İçerik silindi');
        this.load();
      },
      error: err => this.swal.error('Silinemedi', err.error?.errors?.[0]?.errorMessage)
    });
  }
}
