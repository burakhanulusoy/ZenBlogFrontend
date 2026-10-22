import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { RoleService } from '../../_services/role-service';
import { SweetAlert } from '../../_services/sweet-alert';
import { ApiError } from '../../_models/result';
import { ROLE_DESCRIPTIONS, RoleDto } from '../../_models/role';
import { ROLE_LABELS } from '../../_models/user';

// =====================================================================
// ROLLER (sadece Admin, Site yönetimi)
// Sistem rolleri (Admin, Writer, User) kilitli: silinemez, adı değişmez.
// Özel roller eklenebilir / düzenlenebilir / silinebilir (içinde kullanıcı yoksa).
// =====================================================================
@Component({
  selector: 'app-roles',
  standalone: false,
  templateUrl: './roles.html',
  styleUrl: './roles.css'
})
export class Roles implements OnInit {

  constructor(private roleService: RoleService,
              private swal: SweetAlert) {}

  roles: RoleDto[] = [];
  isLoading = true;
  errorMessage = '';

  // Ekle / düzenle penceresi
  dialogVisible = false;
  isEditMode = false;
  isSaving = false;
  form = { id: '', name: '' };
  errors: ApiError[] = [];

  ngOnInit(): void {
    this.loadRoles();
  }

  loadRoles() {
    this.isLoading = true;
    this.errorMessage = '';

    this.roleService.getAll().subscribe({
      next: result => {
        // Önce sistem rolleri, sonra özel roller (alfabetik)
        this.roles = (result.data ?? []).sort((a, b) =>
          Number(b.isSystem) - Number(a.isSystem) || a.name.localeCompare(b.name));
        this.isLoading = false;
      },
      error: err => {
        this.isLoading = false;
        this.errorMessage = err.error?.errors?.[0]?.errorMessage ?? "Roller yüklenemedi.";
      }
    });
  }

  get systemRoles(): RoleDto[] {
    return this.roles.filter(r => r.isSystem);
  }

  get customRoles(): RoleDto[] {
    return this.roles.filter(r => !r.isSystem);
  }

  label(role: RoleDto): string {
    return ROLE_LABELS[role.name] ?? role.name;
  }

  description(role: RoleDto): string {
    return ROLE_DESCRIPTIONS[role.name] ?? 'Özel rol. Kodda karşılığı olmadığı için şimdilik ek bir yetki vermiyor.';
  }

  // Sistem rolü ikonları
  icon(role: RoleDto): string {
    switch (role.name) {
      case 'Admin': return 'pi pi-shield';
      case 'Writer': return 'pi pi-pencil';
      case 'User': return 'pi pi-user';
      default: return 'pi pi-tag';
    }
  }

  // ---------------------------------------------------------------
  // EKLE / DÜZENLE
  // ---------------------------------------------------------------
  openCreate() {
    this.isEditMode = false;
    this.form = { id: '', name: '' };
    this.errors = [];
    this.dialogVisible = true;
  }

  openEdit(role: RoleDto) {
    this.isEditMode = true;
    this.form = { id: role.id, name: role.name };
    this.errors = [];
    this.dialogVisible = true;
  }

  get nameError(): string | undefined {
    return this.errors.find(e => e.propertyName === 'Name' || e.propertyName?.startsWith('Duplicate'))?.errorMessage;
  }

  get otherErrors(): ApiError[] {
    return this.errors.filter(e => e.propertyName !== 'Name' && !e.propertyName?.startsWith('Duplicate'));
  }

  save(roleForm: NgForm) {
    if (roleForm.invalid) {
      roleForm.control.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    this.errors = [];

    const name = this.form.name.trim();
    const request = this.isEditMode
      ? this.roleService.update(this.form.id, name)
      : this.roleService.create(name);

    request.subscribe({
      next: () => {
        this.isSaving = false;
        this.dialogVisible = false;
        this.swal.success(this.isEditMode ? 'Rol güncellendi' : 'Rol eklendi');
        this.loadRoles();
      },
      error: err => {
        this.isSaving = false;
        if (err.status === 400 && err.error?.errors) {
          this.errors = err.error.errors;
        } else {
          this.swal.error('Rol kaydedilemedi', err.error?.errorMessage ?? `Durum kodu: ${err.status}`);
        }
      }
    });
  }

  // ---------------------------------------------------------------
  // SİL
  // ---------------------------------------------------------------
  async deleteRole(role: RoleDto) {
    const confirmed = await this.swal.confirm({
      title: 'Rol silinsin mi?',
      text: `"${role.name}" rolü kalıcı olarak silinecek.`,
      confirmText: 'Evet, sil',
      danger: true
    });
    if (!confirmed) return;

    this.roleService.delete(role.id).subscribe({
      next: () => {
        this.swal.success('Rol silindi');
        this.loadRoles();
      },
      error: err => {
        this.swal.error('Rol silinemedi', err.error?.errors?.[0]?.errorMessage);
      }
    });
  }
}
