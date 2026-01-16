import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
// Importación corregida según tu estructura:
import { EspaciosService } from '../../services/espacios';

@Component({
  selector: 'app-formulario-espacio',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './formulario-espacio.html',
  styleUrls: ['./formulario-espacio.css']
})
export class FormularioEspacioComponent {
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

  constructor(private fb: FormBuilder) {
    this.espacioForm = this.fb.group({
      titulo: ['', Validators.required],
      ciudad: ['', Validators.required],
      direccion: ['', Validators.required],
      descripcion: ['', [Validators.required, Validators.minLength(20)]],
      precio_hora: ['', [Validators.required, Validators.min(1)]],
      capacidad: ['', [Validators.required, Validators.min(1)]],
      servicios: [[]]
    });
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
}