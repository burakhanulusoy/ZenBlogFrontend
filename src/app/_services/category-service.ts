import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Result } from '../_models/result';
import { CategoryDto } from '../_models/category';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {

  // Hocada port 7000, bizim API'mizde 7200
  baseUrl = "https://localhost:7200/api/categories/";

  constructor(private http: HttpClient) {}

  getCategories() {
    return this.http.get<Result<CategoryDto[]>>(this.baseUrl);
  }
}
