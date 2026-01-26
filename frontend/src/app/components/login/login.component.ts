import { Component } from '@angular/core';
import { LoginFormComponent } from '../login-form/login-form.component';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [LoginFormComponent],
    templateUrl: './login.component.html',
    styles: [`
        :host {
            display: flex;
            flex-direction: column;
            flex-grow: 1;
            justify-content: center;
            min-height: 100%;
        }
    `]
})
export class LoginComponent { }
