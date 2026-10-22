// GET /api/roles → her rol (backend: GetRolesQueryResult)
export class RoleDto {
  id: string;
  name: string;
  userCount: number;   // bu rolde kaç kişi var
  isSystem: boolean;   // Admin / Writer / User → silinemez, adı değişmez
}

// Sistem rollerinin ne işe yaradığı (Roller sayfasında açıklama olarak)
export const ROLE_DESCRIPTIONS: Record<string, string> = {
  Admin: 'Yönetim paneline erişir; siteyi, kullanıcıları ve içerikleri yönetir.',
  Writer: 'Yazar paneline erişir; blog yazar, düzenler ve siler.',
  User: 'Temel rol. Herkeste bulunur; okur ve hesap işlemlerini yapar.'
};
