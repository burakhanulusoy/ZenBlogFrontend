import { NameCount } from './dashboard';

// =====================================================================
// LOG KAYITLARI (backend: LogResults)
// =====================================================================
export type LogPeriod = '1h' | '24h' | '7d' | '30d';

export const LOG_PERIODS: { value: LogPeriod; label: string }[] = [
  { value: '1h', label: '1 saat' },
  { value: '24h', label: '24 saat' },
  { value: '7d', label: '7 gün' },
  { value: '30d', label: '30 gün' }
];

export interface LogEntryDto {
  id: string;
  index: string;
  timestamp: string;
  level: string;
  message: string;
  eventType?: string;
  userId?: string;
  userName?: string;
  targetUserId?: string;
  targetUserName?: string;
  statusCode?: number;
  path?: string;
  durationMs?: number;
  errorType?: string;
  traceId?: string;
  requestName?: string;
}

export interface LogSearchDto { total: number; page: number; pageSize: number; items: LogEntryDto[]; }
export interface LogTimelinePoint { time: string; information: number; warning: number; error: number; }
export interface SlowEndpointDto { path: string; avgMs: number; count: number; }

export interface LogSummaryDto {
  total: number;
  errors: number;
  warnings: number;
  requests: number;
  serverErrors: number;
  clientErrors: number;
  avgDurationMs?: number;
  failedLogins: number;
  events: NameCount[];
  timeline: LogTimelinePoint[];
  slowest: SlowEndpointDto[];
}

export interface LogDetailDto { id: string; index: string; source: any; userNames: Record<string, string>; }

// Listeyi getirirken kullanılan filtre
export interface LogFilter {
  period: LogPeriod;
  levels: string[];
  eventType: string | null;
  search: string;
  userId: string | null;
  traceId: string | null;
  onlyEvents: boolean;
  page: number;
  pageSize: number;
}

// Seviyelerin Türkçesi ve rengi
export const LEVEL_META: Record<string, { label: string; tone: string }> = {
  Verbose: { label: 'Ayrıntı', tone: 'muted' },
  Debug: { label: 'Debug', tone: 'muted' },
  Information: { label: 'Bilgi', tone: 'info' },
  Warning: { label: 'Uyarı', tone: 'warn' },
  Error: { label: 'Hata', tone: 'danger' },
  Fatal: { label: 'Kritik', tone: 'danger' }
};

// Olay türlerinin Türkçesi, simgesi ve rengi (backend: LogEvents)
export const EVENT_META: Record<string, { label: string; icon: string; tone: string }> = {
  LoginSucceeded: { label: 'Başarılı giriş', icon: 'pi pi-sign-in', tone: 'success' },
  LoginFailed: { label: 'Başarısız giriş', icon: 'pi pi-lock', tone: 'warn' },
  AccountLocked: { label: 'Hesap kilitlendi', icon: 'pi pi-lock', tone: 'danger' },
  TurnstileFailed: { label: 'Bot doğrulaması başarısız', icon: 'pi pi-shield', tone: 'warn' },
  RateLimited: { label: 'Hız sınırı aşıldı', icon: 'pi pi-stopwatch', tone: 'warn' },
  UserBlocked: { label: 'Kullanıcı bloke edildi', icon: 'pi pi-ban', tone: 'danger' },
  UserUnblocked: { label: 'Bloke kaldırıldı', icon: 'pi pi-check-circle', tone: 'success' },
  RoleChanged: { label: 'Rol değişti', icon: 'pi pi-key', tone: 'info' },
  WriterApplicationApproved: { label: 'Yazarlık onaylandı', icon: 'pi pi-star', tone: 'success' },
  WriterApplicationRejected: { label: 'Yazarlık reddedildi', icon: 'pi pi-times-circle', tone: 'muted' },
  AccountClosed: { label: 'Hesap kapatıldı', icon: 'pi pi-sign-out', tone: 'muted' },
  AccountReactivated: { label: 'Hesap geri açıldı', icon: 'pi pi-replay', tone: 'success' },
  EmailFailed: { label: 'E-posta gönderilemedi', icon: 'pi pi-envelope', tone: 'danger' },
  ReminderJobCompleted: { label: 'Hatırlatma görevi', icon: 'pi pi-clock', tone: 'info' },
  ReminderJobFailed: { label: 'Hatırlatma görevi hatası', icon: 'pi pi-clock', tone: 'danger' }
};
