import { Component } from '@angular/core';
import { AuthService } from '../../_services/auth-service';
import { LoginDto } from '../../_models/loginDto';
import { Router } from '@angular/router';
declare const alertify:any;

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {

constructor(private authService:AuthService,
  private router: Router
){}

loginDto: LoginDto = new LoginDto()
token :any;
decodedToken: any;


login(){
this.authService.login(this.loginDto).subscribe({
  next: result => {this.token= result.data.token;
    localStorage.setItem("token",result.data.token); //local stroage de saklıyoruz token bılgılerını

          alertify.success("Login Successful!");
          this.router.navigate(["/admin"])


  },
  error: result => {
    console.log(result.error.errors);
    alertify.error("Login Failed!")
  }
})

}

decodeToken(){
 let decodedToken= this.authService.decodeToken();
 this.decodedToken = decodedToken;
}



}
