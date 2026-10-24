import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Result } from '../_models/result';
import { ContactDto } from '../_models/contact';

// İLETİŞİM BİLGİLERİ → /api/contacts
@Injectable({
  providedIn: 'root'
})
export class ContactService {

  baseUrl = "https://localhost:7200/api/contacts/";

  constructor(private http: HttpClient) {}

  // En yeni en üstte → [0] sitede kullanılan
  getAll() {
    return this.http.get<Result<ContactDto[]>>(this.baseUrl);
  }

  create(dto: Omit<ContactDto, 'id'>) {
    return this.http.post<Result<any>>(this.baseUrl, dto);
  }

  update(dto: ContactDto) {
    return this.http.put<Result<any>>(this.baseUrl, dto);
  }
}
