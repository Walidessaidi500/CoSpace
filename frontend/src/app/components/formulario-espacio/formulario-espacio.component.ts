import { Component, Input, ChangeDetectorRef, ElementRef, ViewChild, AfterViewInit, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
// Importación corregida según tu estructura:
import { EspaciosService } from '../../services/espacios';

declare var google: any;

@Component({
  selector: 'app-formulario-espacio',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './formulario-espacio.component.html',
  styleUrl: './formulario-espacio.component.css'
})
export class FormularioEspacioComponent implements AfterViewInit {
  @ViewChild('addressInput') addressInput!: ElementRef;
  @Input() isEditMode: boolean = false;
  espacioForm: FormGroup;
  selectedFiles: File[] = [];
  previewImages: string[] = [];

  amenidades = [
    { id: 1, nombre: 'WiFi de Alta Velocidad' },
    { id: 2, nombre: 'Café y Té Gratis' },
    { id: 3, nombre: 'Impresora' },
    { id: 4, nombre: 'Salas de Reuniones' },
    { id: 5, nombre: 'Estacionamiento' },
    { id: 6, nombre: 'Aire Acondicionado' },
    { id: 7, nombre: 'Pizarras' },
    { id: 8, nombre: 'Cocina' }
  ];

  constructor(
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {
    this.espacioForm = this.fb.group({
      titulo: ['', Validators.required],
      ciudad: ['', Validators.required],
      direccion: ['', Validators.required],
      descripcion: ['', [Validators.required, Validators.minLength(20)]],
      precio_hora: ['', [Validators.required, Validators.min(1)]],
      capacidad: ['', [Validators.required, Validators.min(1)]],
      servicios: [[]],
      latitud: [''],
      longitud: ['']
    });
  }

  ngAfterViewInit() {
    this.initAutocomplete();
  }

  initAutocomplete() {
    // Check if google is available
    if (typeof google !== 'undefined') {
      const autocomplete = new google.maps.places.Autocomplete(this.addressInput.nativeElement, {
        types: ['geocode'], // 'address' or 'geocode' covers most addresses
        fields: ['address_components', 'geometry', 'formatted_address']
      });

      autocomplete.addListener('place_changed', () => {
        this.ngZone.run(() => {
          const place = autocomplete.getPlace();

          if (!place.geometry) {
            // User entered the name of a Place that was not suggested and
            // pressed the Enter key, or the Place Details request failed.
            return;
          }

          // 1. Update formatted address and coordinates
          this.espacioForm.patchValue({
            direccion: place.formatted_address,
            latitud: place.geometry.location.lat(),
            longitud: place.geometry.location.lng()
          });

          // 2. Extract city/locality
          let city = '';
          // Iterate components to find locality
          for (const component of place.address_components) {
            const types = component.types;
            if (types.includes('locality')) {
              city = component.long_name;
              break;
            }
          }

          // Fallback if locality is not found (sometimes it's under administrative_area_level_2 etc)
          if (!city) {
            for (const component of place.address_components) {
              if (component.types.includes('administrative_area_level_2')) {
                city = component.long_name;
                break;
              }
            }
          }

          if (city) {
            this.espacioForm.patchValue({ ciudad: city });
          }
        });
      });
    }
  }

  toggleAmenidad(id: number, event: any) {
    const current = this.espacioForm.get('servicios')?.value as number[];
    if (event.target.checked) {
      this.espacioForm.patchValue({ servicios: [...current, id] });
    } else {
      this.espacioForm.patchValue({ servicios: current.filter((x: number) => x !== id) });
    }
  }

  // Métodos para el manejo de archivos
  onFileSelected(event: any) {
    if (event.target.files && event.target.files.length > 0) {
      this.processFiles(Array.from(event.target.files));
      // Reset input to allow selecting the same file again if needed
      event.target.value = '';
    }
  }

  onDragOver(event: any) {
    event.preventDefault();
    event.stopPropagation();
  }

  onFileDropped(event: any) {
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      this.processFiles(Array.from(event.dataTransfer.files));
    }
  }

  processFiles(files: File[]) {
    for (let file of files) {
      // Validar tipo y tamaño si es necesario
      if (file.type.match(/image\/*/) == null) {
        continue; // Solo imágenes
      }

      this.selectedFiles.push(file);

      // Crear preview
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.previewImages.push(e.target.result);
        this.cdr.detectChanges(); // Force view update
      }
      reader.readAsDataURL(file);
    }
  }

  removeFile(index: number) {
    this.selectedFiles.splice(index, 1);
    this.previewImages.splice(index, 1);
  }

  // Método auxiliar para preparar los datos para el envío
  getFormData(): FormData {
    const formData = new FormData();

    // Añadir campos de texto
    Object.keys(this.espacioForm.controls).forEach(key => {
      if (key === 'servicios') {
        const servicios = this.espacioForm.get('servicios')?.value;
        // Para arrays en FormData, solemos enviarlos así para que Laravel los procese bien
        servicios.forEach((id: number) => {
          formData.append('servicios[]', id.toString());
        });
      } else {
        const value = this.espacioForm.get(key)?.value;
        if (value !== null && value !== undefined) {
          formData.append(key, value);
        }
      }
    });

    // Añadir imágenes
    this.selectedFiles.forEach((file) => {
      formData.append('fotos[]', file);
    });

    return formData;
  }

  // Nuevo método para rellenar datos (Edición)
  patchData(data: any) {
    this.espacioForm.patchValue({
      titulo: data.titulo,
      ciudad: data.ciudad,
      direccion: data.direccion,
      descripcion: data.descripcion,
      precio_hora: data.precio_hora,
      capacidad: data.capacidad,
      servicios: data.servicios ? data.servicios.map((s: any) => s.id_servicio) : [],
      latitud: data.latitud,
      longitud: data.longitud
    });

    // Handle existing images for preview
    if (data.fotos && data.fotos.length > 0) {
      this.previewImages = data.fotos.map((f: any) => this.getFullUrl(f.url_foto));
    }
  }

  // TODO: Move this helper to a shared utility or service
  private getFullUrl(path: string | null): string {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `http://127.0.0.1:8000${path}`;
  }
}