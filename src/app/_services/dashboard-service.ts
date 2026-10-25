import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Result } from '../_models/result';
import { AdminDashboardDto, DashboardPeriod, WriterDashboardDto } from '../_models/dashboard';

// DASHBOARD → /api/dashboard/...?period=7d|30d|12m (her panel tek istekte)
@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  private api = "https://localhost:7200/api/dashboard/";

  constructor(private http: HttpClient) {}

  getAdmin(period: DashboardPeriod) {
    return this.http.get<Result<AdminDashboardDto>>(this.api + 'admin', { params: new HttpParams().set('period', period) });
  }

  getWriter(period: DashboardPeriod) {
    return this.http.get<Result<WriterDashboardDto>>(this.api + 'writer', { params: new HttpParams().set('period', period) });
  }
}
