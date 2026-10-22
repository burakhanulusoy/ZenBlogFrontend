// Hesap durumu (backend'deki AccountStatus enum'unun yazı hali)
export type AccountStatus = 'Active' | 'PendingDeletion' | 'Blocked';

// Ekranda görünen Türkçe adlar
// Record<A, B>: A'nın her değeri için bir B (C#: Dictionary<A, B>)
export const STATUS_LABELS: Record<AccountStatus, string> = {
  Active: 'Aktif',
  PendingDeletion: 'Kapatılıyor',
  Blocked: 'Bloke'
};

export const ROLE_LABELS: Record<string, string> = {
  Admin: 'Yönetici',
  Writer: 'Yazar',
  User: 'Okur'
};

// GET /api/users → listedeki her satır (backend: GetUserListQueryResult)
export class UserListDto {
  id: string;
  name: string;
  surname: string;
  userName: string;
  email: string;
  imageUrl?: string;
  emailConfirmed: boolean;
  roles: string[];
  status: AccountStatus;
  deletionDeadline?: string;   // sadece "Kapatılıyor" ise dolu
  blogCount: number;
  lastBlockedAt?: string;
}

// Detaydaki son bloglar
export class UserRecentBlogDto {
  id: string;
  mainTitle: string;
  coverImage: string;
  createdAt: string;
}

// Detaydaki bloke geçmişi
export class UserBlockHistoryDto {
  id: string;
  reason: string;
  evidenceUrl: string;
  blockedAt: string;
  blockedByAdminId: string;
  blockedByAdminName: string;
  unblockedAt?: string;
  unblockedByAdminName?: string;
  unblockReason?: string;
}

// GET /api/users/{id} → detay (backend: GetUserByIdQueryResult)
export class UserDetailDto {
  id: string;
  name: string;
  surname: string;
  userName: string;
  email: string;
  phoneNumber?: string;
  imageUrl?: string;
  location?: string;
  description?: string;
  instagramUrl?: string;
  twitterUrl?: string;
  linkedlnUrl?: string;
  facebookUrl?: string;
  emailConfirmed: boolean;
  roles: string[];
  status: AccountStatus;
  deletionRequestedAt?: string;
  deletionDeadline?: string;
  blogCount: number;
  commentCount: number;
  recentBlogs: UserRecentBlogDto[];
  blockHistory: UserBlockHistoryDto[];
}

// GET /api/users/me → Profilim (backend: GetMyProfileQueryResult)
export class MyProfileDto {
  id: string;
  name: string;
  surname: string;
  userName: string;
  email: string;
  phoneNumber?: string;
  imageUrl?: string;
  location?: string;
  description?: string;
  instagramUrl?: string;
  twitterUrl?: string;
  linkedlnUrl?: string;
  facebookUrl?: string;
  hasPassword: boolean;       // Google ile gelenlerde false olabilir
  canCloseAccount: boolean;   // Admin değilse true
  roles: string[];
}

// PUT /api/users/me cevabı (backend: LoginCommandResult)
export class TokenResultDto {
  token: string;
  expiresAt: string;
  accountReactivated?: boolean;
}

// POST /api/users/me/close cevabı
export class CloseAccountResultDto {
  deletionDeadline: string;
}

