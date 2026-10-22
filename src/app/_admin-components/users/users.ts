import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from '../../_services/user-service';
import { AccountStatus, ROLE_LABELS, STATUS_LABELS, UserListDto } from '../../_models/user';

// Durum sekmeleri: 'all' + üç durum
type StatusFilter = 'all' | AccountStatus;

// =====================================================================
// KULLANICILAR (sadece Admin, Site yönetimi)
// Liste + ara + rol filtresi + durum sekmeleri. Satıra tıklayınca detay.
// Bloke işlemi bilerek SADECE detay sayfasında (yanlışlıkla tıklanmasın diye).
// =====================================================================
@Component({
  selector: 'app-users',
  standalone: false,
  templateUrl: './users.html',
  styleUrl: './users.css'
})
export class Users implements OnInit {

  constructor(private userService: UserService,
              private router: Router,
              private route: ActivatedRoute) {}

  users: UserListDto[] = [];
  filteredUsers: UserListDto[] = [];

  searchText = '';
  selectedRole: string | null = null;
  statusFilter: StatusFilter = 'all';

  isLoading = true;
  errorMessage = '';

  readonly roleOptions = [
    { label: 'Yönetici', value: 'Admin' },
    { label: 'Yazar', value: 'Writer' },
    { label: 'Okur', value: 'User' }
  ];

  readonly statusTabs: { value: StatusFilter; label: string; icon: string }[] = [
    { value: 'all', label: 'Tümü', icon: 'pi pi-users' },
    { value: 'Active', label: 'Aktif', icon: 'pi pi-check-circle' },
    { value: 'PendingDeletion', label: 'Kapatılıyor', icon: 'pi pi-clock' },
    { value: 'Blocked', label: 'Bloke', icon: 'pi pi-ban' }
  ];

  // Her sekmenin yanındaki sayı
  counts: Record<StatusFilter, number> = { all: 0, Active: 0, PendingDeletion: 0, Blocked: 0 };

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers() {
    this.isLoading = true;
    this.errorMessage = '';

    this.userService.getAll().subscribe({
      next: result => {
        this.users = result.data ?? [];
        this.calculateCounts();
        this.applyFilters();
        this.isLoading = false;
      },
      error: err => {
        this.isLoading = false;
        this.errorMessage = err.error?.errors?.[0]?.errorMessage ?? "Kullanıcılar yüklenemedi.";
      }
    });
  }

  private calculateCounts() {
    this.counts = {
      all: this.users.length,
      Active: this.users.filter(u => u.status === 'Active').length,
      PendingDeletion: this.users.filter(u => u.status === 'PendingDeletion').length,
      Blocked: this.users.filter(u => u.status === 'Blocked').length
    };
  }

  // Ad, kullanıcı adı ya da e-postada ara + rol + durum
  applyFilters() {
    const search = this.searchText.trim().toLocaleLowerCase('tr');

    this.filteredUsers = this.users.filter(u => {
      const matchesSearch = !search
        || this.fullName(u).toLocaleLowerCase('tr').includes(search)
        || u.userName?.toLocaleLowerCase('tr').includes(search)
        || u.email?.toLocaleLowerCase('tr').includes(search);

      const matchesRole = !this.selectedRole || u.roles.includes(this.selectedRole);
      const matchesStatus = this.statusFilter === 'all' || u.status === this.statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }

  onSearchChange(value: string) {
    this.searchText = value;
    this.applyFilters();
  }

  onRoleChange(role: string | null) {
    this.selectedRole = role;
    this.applyFilters();
  }

  setStatus(status: StatusFilter) {
    this.statusFilter = status;
    this.applyFilters();
  }

  get hasActiveFilter(): boolean {
    return !!this.searchText.trim() || !!this.selectedRole || this.statusFilter !== 'all';
  }

  clearFilters() {
    this.searchText = '';
    this.selectedRole = null;
    this.statusFilter = 'all';
    this.applyFilters();
  }

  // Detay: /admin/users/{id}
  view(user: UserListDto) {
    this.router.navigate([user.id], { relativeTo: this.route });
  }

  // ---------------------------------------------------------------
  // GÖRÜNÜM YARDIMCILARI
  // ---------------------------------------------------------------
  fullName(user: UserListDto): string {
    return `${user.name ?? ''} ${user.surname ?? ''}`.trim() || user.userName || 'İsimsiz';
  }

  initials(user: UserListDto): string {
    return this.fullName(user)
      .split(' ')
      .filter(p => p)
      .map(p => p[0].toLocaleUpperCase('tr'))
      .slice(0, 2)
      .join('');
  }

  statusLabel(status: AccountStatus): string {
    return STATUS_LABELS[status] ?? status;
  }

  roleLabel(role: string): string {
    return ROLE_LABELS[role] ?? role;
  }
}
