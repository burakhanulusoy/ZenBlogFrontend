export class ApiError {
  propertyName!: string;
  errorMessage!: string;
}

export class Result<T> {
  data!: T | null;
  errors!: ApiError[];
  isSuccessful!: boolean;
}
