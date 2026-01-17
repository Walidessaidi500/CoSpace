import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from '../../services/api';

@Component({
  selector: 'app-registro-cliente',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './registro-cliente.html',
  styleUrl: './registro-cliente.css',
})
export class RegistroClienteComponent {
  registerForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      nombre_completo: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  // Validador personalizado para contraseñas
  passwordMatchValidator(form: FormGroup) {
    return form.get('password')?.value === form.get('confirmPassword')?.value
      ? null : { mismatch: true };
  }

  onSubmit() {
    if (this.registerForm.valid) {
      // Remover confirmPassword antes de enviar si no se necesita en backend
      const { confirmPassword, ...dataToSend } = this.registerForm.value;

      this.apiService.registerClient(dataToSend).subscribe({
        next: (res: any) => {
          console.log('Cliente registrado:', res);
          alert('Cuenta de cliente creada con éxito');
          this.router.navigate(['/login']);
        },
        error: (err: any) => {
          console.error('Error al registrar cliente:', err);
          alert('Error al registrar. Por favor intenta de nuevo.');
        }
      });
    } else {
      this.registerForm.markAllAsTouched();
    }
  }
}
