import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Result } from '../_models/result';
import { ContactMessageDto, MessageStatus } from '../_models/contact';

// GELEN MESAJLAR → /api/contactmessages
// (Sitedeki iletişim formu da ileride buradaki send() metodunu kullanacak)
@Injectable({
  providedIn: 'root'
})
export class ContactMessageService {

  baseUrl = "https://localhost:7200/api/contactmessages/";

  constructor(private http: HttpClient) {}

  getAll() {
    return this.http.get<Result<ContactMessageDto[]>>(this.baseUrl);
  }

  // Açılınca backend "Okundu" yapar
  getById(id: string) {
    return this.http.get<Result<ContactMessageDto>>(this.baseUrl + id);
  }

  // Menü rozeti: okunmamış mesajlar
  getPending() {
    return this.http.get<Result<ContactMessageDto[]>>(this.baseUrl + 'byStatus/Pending');
  }

  updateStatus(id: string, status: MessageStatus) {
    return this.http.put<Result<any>>(this.baseUrl, { id, status });
  }

  delete(id: string) {
    return this.http.delete<Result<any>>(this.baseUrl + id);
  }
}
