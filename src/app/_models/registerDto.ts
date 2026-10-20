// Backend'deki CreateUserCommand'ın karşılığı.
// Alan adları API'nin beklediği JSON ile aynı:
//   { name, surname, userName, email, phoneNumber, password, confirmPassword }
export class RegisterDto {

  name;
  surname;
  userName;
  email;
  phoneNumber;
  password;
  confirmPassword;

}
