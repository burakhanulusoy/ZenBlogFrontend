// Başvuru durumu (backend'deki WriterApplicationStatus enum'unun yazı hali)
export type WriterApplicationStatus = 'Pending' | 'Reviewed' | 'Approved' | 'Rejected';

export const APPLICATION_STATUS_LABELS: Record<WriterApplicationStatus, string> = {
  Pending: 'Beklemede',
  Reviewed: 'İnceleniyor',
  Approved: 'Onaylandı',
  Rejected: 'Reddedildi'
};

// Kullanıcının kendi son başvurusu (özet)
export class WriterApplicationSummaryDto {
  id: string;
  status: WriterApplicationStatus;
  topics: string;
  submittedAt: string;
  decidedAt?: string;
  rejectReason?: string;
}

// GET /api/users/me/writer-application
export class MyWriterApplicationDto {
  isWriter: boolean;
  canApply: boolean;
  cannotApplyReason?: string;
  canApplyAfter?: string;
  latest?: WriterApplicationSummaryDto;
}

// POST /api/users/me/writer-application
export class SubmitWriterApplicationDto {
  categoryIds: string[];
  motivation: string;
  experience: string;
  sampleLinks: string;
  acceptedRules: boolean;
}

// Admin listesi
export class WriterApplicationListItemDto {
  id: string;
  userId: string;
  fullName: string;
  userName: string;
  email: string;
  imageUrl?: string;
  topics: string;
  status: WriterApplicationStatus;
  submittedAt: string;
  reviewedAt?: string;
}

// Admin detayı
export class WriterApplicationDetailDto {
  id: string;
  userId: string;
  fullName: string;
  userName: string;
  email: string;
  imageUrl?: string;
  accountStatus: string;
  topics: string;
  motivation: string;
  experience?: string;
  sampleLinks?: string;
  status: WriterApplicationStatus;
  submittedAt: string;
  reviewedAt?: string;
  decidedAt?: string;
  decidedByAdminName?: string;
  rejectReason?: string;
  previousApplicationCount: number;
}
