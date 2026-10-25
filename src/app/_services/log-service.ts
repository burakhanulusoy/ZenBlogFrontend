import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Result } from '../_models/result';
import { LogDetailDto, LogFilter, LogPeriod, LogSearchDto, LogSummaryDto } from '../_models/log';

// LOG KAYITLARI → /api/logs (sadece Admin)
@Injectable({
  providedIn: 'root'
})
export class LogService {

  private api = "https://localhost:7200/api/logs";

  constructor(private http: HttpClient) {}

  // Sadece dolu filtreler adrese eklenir (?period=24h&levels=Error,Warning...)
  getLogs(f: LogFilter) {
    let params = new HttpParams()
      .set('period', f.period)
      .set('page', f.page)
      .set('pageSize', f.pageSize);

    if (f.levels.length > 0) params = params.set('levels', f.levels.join(','));
    if (f.eventType) params = params.set('eventType', f.eventType);
    if (f.search.trim()) params = params.set('search', f.search.trim());
    if (f.userId) params = params.set('userId', f.userId);
    if (f.traceId) params = params.set('traceId', f.traceId);
    if (f.onlyEvents) params = params.set('onlyEvents', true);

    return this.http.get<Result<LogSearchDto>>(this.api, { params });
  }

  getSummary(period: LogPeriod) {
    return this.http.get<Result<LogSummaryDto>>(`${this.api}/summary`, { params: new HttpParams().set('period', period) });
  }

  getDetail(index: string, id: string) {
    return this.http.get<Result<LogDetailDto>>(`${this.api}/detail`, {
      params: new HttpParams().set('index', index).set('id', id)
    });
  }
}
