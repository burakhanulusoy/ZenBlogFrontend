// Üyenin bir sosyal hesabı (backend: GetTeamSocialMediaResult)
export class TeamSocialDto {
  id: string;
  socialMediaName: string;   // platform: "LinkedIn", "X"...
  icon: string;              // "pi pi-linkedin" (backend otomatik belirler)
  url: string;
}

// Ekip üyesi (backend: GetTeamsQueryResult / GetTeamByIdQueryResult)
export class TeamDto {
  id: string;
  name: string;
  surname: string;
  title: string;
  description: string;
  image: string;
  createdAt: string;
  teamSocialMedias: TeamSocialDto[];
}

// Seçilebilir platform (GET /api/teams/platforms)
export class TeamPlatformDto {
  name: string;
  icon: string;
}

// Platformların ekranda görünen adı (anahtar backend'deki adla aynı)
export const PLATFORM_LABELS: Record<string, string> = {
  Instagram: 'Instagram',
  X: 'X (Twitter)',
  LinkedIn: 'LinkedIn',
  GitHub: 'GitHub',
  Facebook: 'Facebook',
  YouTube: 'YouTube',
  TikTok: 'TikTok',
  Website: 'Web sitesi'
};
