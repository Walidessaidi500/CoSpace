import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../../services/api';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-registro-anfitrion',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule],
    templateUrl: './registro-anfitrion.component.html',
    styleUrls: ['./registro-anfitrion.component.css']
})
export class RegistroAnfitrionComponent {
    registroForm: FormGroup;
    loading = false;
    errorMessage = '';

    constructor(
        private fb: FormBuilder,
        private apiService: ApiService,
        private router: Router
    ) {
        this.registroForm = this.fb.group({
            nombre_completo: ['', Validators.required],
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.minLength(8)]],
            password_confirmation: ['', Validators.required],
            titulo: ['', Validators.required], // Nombre del Espacio
            direccion: ['', Validators.required],
            capacidad: ['', [Validators.required, Validators.min(1)]],
            precio_hora: ['', [Validators.required, Validators.min(0)]],
            descripcion: ['', Validators.required]
        }, { validators: this.passwordMatchValidator });
    }

    // Validador personalizado para contraseñas
    passwordMatchValidator(form: FormGroup) {
        return form.get('password')?.value === form.get('password_confirmation')?.value
            ? null : { mismatch: true };
    }

    onSubmit() {
        if (this.registroForm.invalid) return;

        this.loading = true;
        // Usamos el servicio API genérico 'register' por ahora
        this.apiService.register(this.registroForm.value).subscribe({
            next: (res: any) => {
                alert('Cuenta creada con éxito');
                this.router.navigate(['/login']); // Redirigir a login
            },
            error: (err: any) => {
                this.errorMessage = 'Hubo un error en el registro. Verifica los datos.';
                this.loading = false;
                console.error(err);
            }
        });
    }
}
