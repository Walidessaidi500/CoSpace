import { Component } from '@angular/core';
import { LoginFormComponent } from '../../components/login-form/login-form';

@Component({
    selector: 'app-login-page',
    standalone: true,
    imports: [LoginFormComponent],
    templateUrl: './login-page.html',
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
export class LoginPageComponent { }
