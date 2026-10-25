// =====================================================================
// DASHBOARD MODELLERİ (backend: DashboardResults)
// =====================================================================
export type DashboardPeriod = '7d' | '30d' | '12m';

export const PERIOD_OPTIONS: { value: DashboardPeriod; label: string }[] = [
  { value: '7d', label: '7 gün' },
  { value: '30d', label: '30 gün' },
  { value: '12m', label: '12 ay' }
];

export const PERIOD_TEXT: Record<DashboardPeriod, string> = {
  '7d': 'son 7 gün',
  '30d': 'son 30 gün',
  '12m': 'son 12 ay'
};

export interface StatValue { total: number; inPeriod: number; previousPeriod: number; }
export interface TrendPoint { key: string; label: string; views: number; blogs: number; comments: number; users: number; }
export interface NameCount { name: string; count: number; }

export interface DashboardBlogItem {
  id: string; title: string; coverImage: string; createdAt: string;
  views: number; comments: number; authorName: string;
}

export interface DashboardCommentItem {
  id: string; isReply: boolean; body: string; createdAt: string;
  authorName: string; authorImage?: string; blogId: string; blogTitle: string;
}

export interface AdminPending { writerApplications: number; unreadMessages: number; pendingDeletions: number; blockedUsers: number; }
export interface DashboardAuthorItem { id: string; name: string; imageUrl?: string; blogs: number; views: number; }
export interface DashboardUserItem { id: string; name: string; userName: string; imageUrl?: string; createdAt: string; }

export interface AdminDashboardDto {
  period: DashboardPeriod;
  blogs: StatValue; users: StatValue; comments: StatValue; views: StatValue;
  pending: AdminPending;
  trend: TrendPoint[];
  categories: NameCount[];
  roles: NameCount[];
  topBlogs: DashboardBlogItem[];
  topAuthors: DashboardAuthorItem[];
  recentComments: DashboardCommentItem[];
  newUsers: DashboardUserItem[];
}

export interface WriterDashboardDto {
  period: DashboardPeriod;
  blogs: StatValue; views: StatValue; comments: StatValue;
  trend: TrendPoint[];
  topBlogs: DashboardBlogItem[];
  recentComments: DashboardCommentItem[];
  categories: NameCount[];
  lastPublishedAt?: string;
}

// Değişim rozeti
export interface DeltaView { text: string; tone: 'up' | 'down' | 'flat'; }

// Geçen döneme göre değişim: ▲ %24 / ▼ %12 / Yeni / —
export function computeDelta(stat: StatValue): DeltaView {
  if (stat.previousPeriod === 0) {
    return stat.inPeriod > 0 ? { text: 'Yeni', tone: 'up' } : { text: '—', tone: 'flat' };
  }
  const percent = Math.round(((stat.inPeriod - stat.previousPeriod) / stat.previousPeriod) * 100);
  if (percent === 0) return { text: '%0', tone: 'flat' };
  return { text: `${percent > 0 ? '▲' : '▼'} %${Math.abs(percent)}`, tone: percent > 0 ? 'up' : 'down' };
}

// İsimden baş harfler
export function initialsOf(name: string): string {
  return (name ?? '').split(' ').filter(p => p).map(p => p[0].toLocaleUpperCase('tr')).slice(0, 2).join('');
}
