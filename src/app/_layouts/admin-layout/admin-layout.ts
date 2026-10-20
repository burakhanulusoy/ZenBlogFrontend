import { AuthService } from './../../_services/auth-service';
import { Component } from '@angular/core';

@Component({
  selector: 'app-admin-layout',
  standalone: false,
  styleUrl: './admin-layout.css',
  templateUrl: './admin-layout.html',
})
export class AdminLayout {


/**
 *
 */
constructor(private authService:AuthService) {

}


  getFullName(){
    let decodedToken= this.authService.decodeToken();
    return decodedToken.fullName;
  }

  loggedIn(){
    return this.authService.loggedIn();
  }



   logout(){

    this.authService.logout();
   }
}
