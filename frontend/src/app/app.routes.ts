import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { RegistroAnfitrionComponent } from './pages/registro-anfitrion/registro-anfitrion.component';


export const routes: Routes = [
    { path: '', component: HomeComponent },
    { path: 'registro-anfitrion', component: RegistroAnfitrionComponent },



    { path: '**', redirectTo: '' }
];
