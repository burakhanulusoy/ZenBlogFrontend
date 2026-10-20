import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainLayout } from './_layouts/main-layout/main-layout';
import { Home } from './_main-components/home/home';
import { AdminLayout } from './_layouts/admin-layout/admin-layout';
import { Category } from './_admin-components/category/category';
import { Login } from './_main-components/login/login';
import { AuthGuard } from './_guards/auth-guard';

const routes: Routes = [

     //Main Routes  http://localhost:4200 buysa direk home   http://localhost:4200/category mesela lategıroşer ıle bloglar gelelcek

   {path:'',component : MainLayout,

    children:[
     {path:'',component:Home},
     {path:'login',component:Login} // localhost:7200/api/login
    ]
   },


    //Admin Routes  http://localhost:4200/admin/category

    {path:'admin',component:AdminLayout,
         canActivate:[AuthGuard],//bunu yaptıgımız an kormaya gecıyor
         children:[

          {path:'category',component:Category,canActivate:[AuthGuard]},

         ]

    }




];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
