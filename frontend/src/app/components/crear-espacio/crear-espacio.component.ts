import { Component, ViewChild, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';

// Imports de tus componentes
import { SidebarAnfitrionComponent } from '../sidebar-anfitrion/sidebar-anfitrion.component';
import { FormularioEspacioComponent } from '../formulario-espacio/formulario-espacio.component';
import { FooterAccionesComponent } from '../footer-acciones/footer-acciones.component';
import { EspaciosService } from '../../services/espacios';

@Component({
  selector: 'app-crear-espacio',
  standalone: true,
  imports: [
    CommonModule,
    SidebarAnfitrionComponent,
    FormularioEspacioComponent,
    FooterAccionesComponent
  ],
  templateUrl: './crear-espacio.component.html'
})
export class CrearEspacioComponent implements OnInit {
  @ViewChild(FormularioEspacioComponent) formularioComponent!: FormularioEspacioComponent;

  isEditMode = false;
  isLoading = true;
  loadingText = 'Cargando información...'; // Default text

  // Toast State
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';

  espacioId: string | null = null;

  // Import ChangeDetectorRef to ensure view updates
  constructor(
    private espaciosService: EspaciosService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.espacioId = this.route.snapshot.paramMap.get('id');
    if (this.espacioId) {
      this.isEditMode = true;
      this.isLoading = true;
      this.loadingText = 'Cargando información...';

      // Fetch existing data
      this.espaciosService.getEspacioById(this.espacioId).subscribe({
        next: (data) => {
          // Small delay to ensure view is ready and provide smooth transition
          setTimeout(() => {
            try {
              if (this.formularioComponent) {
                this.formularioComponent.patchData(data);
              }
            } catch (error) {
              console.error('Error updating form data:', error);
            } finally {
              this.isLoading = false;
              this.cdr.detectChanges(); // Force update
            }
          }, 300); // Reduced timeout
        },
        error: (err) => {
          console.error(err);
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      });
    } else {
      this.isLoading = false;
    }
  }

  onGuardar() {
    if (this.formularioComponent && this.formularioComponent.espacioForm.valid) {
      const formData = this.formularioComponent.getFormData();

      this.isLoading = true;
      this.loadingText = this.isEditMode ? 'Guardando cambios...' : 'Publicando área...';

      if (this.isEditMode && this.espacioId) {
        this.espaciosService.updateEspacio(this.espacioId, formData).subscribe({
          next: () => {
            this.handleSuccess('¡Espacio actualizado correctamente!');
          },
          error: (err: any) => this.handleError(err)
        });
      } else {
        this.espaciosService.crearEspacio(formData).subscribe({
          next: () => {
            this.handleSuccess('¡Espacio creado correctamente!');
          },
          error: (err: any) => this.handleError(err)
        });
      }
    } else {
      if (this.formularioComponent) {
        this.formularioComponent.espacioForm.markAllAsTouched();
      }
      this.showToastNotification('Por favor, revisa los campos obligatorios.', 'error');
    }
  }

  private handleSuccess(message: string) {
    this.isLoading = false;
    this.showToastNotification(message, 'success');

    // Wait for toast to be seen before navigating
    setTimeout(() => {
      this.router.navigate(['/anfitrion/mis-areas']);
    }, 2000);
  }

  private handleError(err: any) {
    this.isLoading = false;
    this.showToastNotification('Error: ' + (err.message || 'Ocurrió un error inesperado'), 'error');
  }

  private showToastNotification(message: string, type: 'success' | 'error') {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;
    this.cdr.detectChanges();

    // Auto hide after 3 seconds if it's an error (success navigates away)
    if (type === 'error') {
      setTimeout(() => {
        this.showToast = false;
        this.cdr.detectChanges();
      }, 3000);
    }
  }

  onCancelar() {
    this.router.navigate(['/anfitrion/mis-areas']);
  }
}