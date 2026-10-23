import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TeamService } from '../../_services/team-service';
import { SweetAlert } from '../../_services/sweet-alert';
import { PLATFORM_LABELS, TeamDto } from '../../_models/team';

// =====================================================================
// EKİP (sadece Admin, Site içeriği)
// Üyeler sitedeki gibi kartlar halinde; eklenme sırasıyla.
// =====================================================================
@Component({
  selector: 'app-teams',
  standalone: false,
  templateUrl: './teams.html',
  styleUrl: './teams.css'
})
export class Teams implements OnInit {

  constructor(private teamService: TeamService,
              private swal: SweetAlert,
              private router: Router,
              private route: ActivatedRoute) {}

  teams: TeamDto[] = [];
  isLoading = true;
  errorMessage = '';

  ngOnInit(): void {
    this.load();
  }

  load() {
    this.isLoading = true;
    this.errorMessage = '';

    this.teamService.getAll().subscribe({
      next: result => {
        this.teams = result.data ?? [];
        this.isLoading = false;
      },
      error: err => {
        this.isLoading = false;
        this.errorMessage = err.error?.errors?.[0]?.errorMessage ?? "Ekip yüklenemedi.";
      }
    });
  }

  platformLabel(name: string): string {
    return PLATFORM_LABELS[name] ?? name;
  }

  goToNew() {
    this.router.navigate(['new'], { relativeTo: this.route });
  }

  edit(team: TeamDto) {
    this.router.navigate(['edit', team.id], { relativeTo: this.route });
  }

  async deleteTeam(team: TeamDto) {
    const confirmed = await this.swal.confirm({
      title: 'Ekip üyesi silinsin mi?',
      text: `${team.name} ${team.surname} ve sosyal hesapları sitedeki ekip bölümünden kaldırılacak.`,
      confirmText: 'Evet, sil',
      danger: true
    });
    if (!confirmed) return;

    this.teamService.delete(team.id).subscribe({
      next: () => {
        this.swal.success('Ekip üyesi silindi');
        this.load();
      },
      error: err => this.swal.error('Silinemedi', err.error?.errors?.[0]?.errorMessage)
    });
  }
}
