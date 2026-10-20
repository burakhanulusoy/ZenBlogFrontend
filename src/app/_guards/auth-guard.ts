import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, GuardResult, MaybeAsync, Router, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../_services/auth-service';
import { ThisReceiver } from '@angular/compiler';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {

   constructor(private authService:AuthService,
              private router:Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): MaybeAsync<GuardResult> {

       if(this.authService.loggedIn()){
        return true;
       }


       console.log("AUTH GUARD ACTIVE")
       this.router.navigate([""]);//giriş yapılmadıysa dırek maınlayaouta atacak
       return false;
  }








}
