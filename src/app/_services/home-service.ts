import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Result } from '../_models/result';
import { HomePageDto } from '../_models/home';

// ANA SAYFA → /api/home (tek istekte bütün veri)
@Injectable({
  providedIn: 'root'
})
export class HomeService {

  baseUrl = "https://localhost:7200/api/home";

  constructor(private http: HttpClient) {}

  getHome() {
    return this.http.get<Result<HomePageDto>>(this.baseUrl);
  }
}
