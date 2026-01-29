import { Component, ElementRef, ViewChild, AfterViewInit, NgZone } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../../services/api';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

declare var google: any;

@Component({
    selector: 'app-registro-anfitrion',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule],
    templateUrl: './registro-anfitrion.component.html',
    styleUrl: './registro-anfitrion.component.css'
})
export class RegistroAnfitrionComponent implements AfterViewInit {
    @ViewChild('addressInput') addressInput!: ElementRef;

    registroForm: FormGroup;
    loading = false;
    errorMessage = '';

    constructor(
        private fb: FormBuilder,
        private apiService: ApiService,
        private router: Router,
        private ngZone: NgZone
    ) {
        this.registroForm = this.fb.group({
            nombre_completo: ['', Validators.required],
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.minLength(8)]],
            password_confirmation: ['', Validators.required],
            titulo: ['', Validators.required], // Nombre del Espacio
            direccion: ['', Validators.required],
            ciudad: ['', Validators.required],
            latitud: [null],
            longitud: [null],
            capacidad: ['', [Validators.required, Validators.min(1)]],
            precio_hora: ['', [Validators.required, Validators.min(0)]],
            descripcion: ['', Validators.required]
        }, { validators: this.passwordMatchValidator });
    }

    ngAfterViewInit() {
        this.initAutocomplete();
    }

    initAutocomplete() {
        if (typeof google === 'undefined' || !google.maps || !google.maps.places) {
            console.error('Google Maps JavaScript API not loaded.');
            return;
        }

        const autocomplete = new google.maps.places.Autocomplete(this.addressInput.nativeElement, {
            types: ['address'], // Restrict to addresses
            fields: ['address_components', 'geometry', 'formatted_address']
        });

        autocomplete.addListener('place_changed', () => {
            this.ngZone.run(() => {
                const place = autocomplete.getPlace();

                if (!place.geometry) {
                    console.error("No details available for input: '" + place.name + "'");
                    return;
                }

                // 1. Get Lat/Lng
                const lat = place.geometry.location.lat();
                const lng = place.geometry.location.lng();

                // 2. Get Formatted Address
                let address = place.formatted_address;
                // Alternatively, build it from components if you want specific format.
                // For now, formatted_address is usually good.

                // 3. Extract City
                let city = '';
                for (const component of place.address_components) {
                    const types = component.types;
                    if (types.includes('locality')) {
                        city = component.long_name;
                    }
                    // Fallback to administrative_area_level_2 or 1 if locality not found (common in some areas)
                    if (!city && types.includes('administrative_area_level_2')) {
                        city = component.long_name;
                    }
                }

                // Update Form
                this.registroForm.patchValue({
                    direccion: address,
                    ciudad: city,
                    latitud: lat,
                    longitud: lng
                });
            });
        });
    }

    // Validador personalizado para contraseñas
    passwordMatchValidator(form: FormGroup) {
        return form.get('password')?.value === form.get('password_confirmation')?.value
            ? null : { mismatch: true };
    }

    onSubmit() {
        if (this.registroForm.invalid) {
            this.registroForm.markAllAsTouched();
            return;
        }

        this.loading = true;
        // Usamos el servicio API genérico 'register' por ahora
        this.apiService.register(this.registroForm.value).subscribe({
            next: (res: any) => {
                alert('Cuenta creada con éxito');
                this.router.navigate(['/iniciar-sesion']);
            },
            error: (err: any) => {
                this.errorMessage = 'Hubo un error en el registro. Verifica los datos.';
                this.loading = false;
                console.error(err);
            }
        });
    }
}
