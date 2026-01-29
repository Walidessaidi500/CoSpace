import { Component, ViewChild, OnInit } from '@angular/core';
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
  espacioId: string | null = null;

  constructor(
    private espaciosService: EspaciosService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit() {
    this.espacioId = this.route.snapshot.paramMap.get('id');
    if (this.espacioId) {
      this.isEditMode = true;
      // Fetch existing data
      this.espaciosService.getEspacioById(this.espacioId).subscribe({
        next: (data) => {
          // We need to wait for view child? logic is safer if we patch after view init, 
          // but usually Angular handles data binding if we pass input. 
          // Since we use a method on the child, we must ensure child exists. 
          // However, ngOnInit runs before ViewChild is available if static: false.
          // We'll handle this by setting a timeout or using ngAfterViewInit, 
          // OR better, we can just save the data and apply it when the ViewChild is ready?
          // For simplicity in this structure: usually fetching takes time so ViewChild is ready by the time data arrives.
          setTimeout(() => {
            if (this.formularioComponent) {
              this.formularioComponent.patchData(data);
            }
          }, 100);
        },
        error: (err) => console.error(err)
      });
    }
  }

  onGuardar() {
    if (this.formularioComponent && this.formularioComponent.espacioForm.valid) {
      const formData = this.formularioComponent.getFormData();

      if (this.isEditMode && this.espacioId) {
        this.espaciosService.updateEspacio(this.espacioId, formData).subscribe({
          next: () => {
            alert('¡Espacio actualizado correctamente!');
            this.router.navigate(['/anfitrion/mis-areas']);
          },
          error: (err: any) => alert('Error: ' + err.message)
        });
      } else {
        this.espaciosService.crearEspacio(formData).subscribe({
          next: () => {
            alert('¡Espacio creado correctamente!');
            this.router.navigate(['/anfitrion/mis-areas']);
          },
          error: (err: any) => alert('Error: ' + err.message)
        });
      }
    } else {
      if (this.formularioComponent) {
        this.formularioComponent.espacioForm.markAllAsTouched();
      }
      alert('Por favor, revisa los campos obligatorios.');
    }
  }

  onCancelar() {
    this.router.navigate(['/anfitrion/mis-areas']);
  }
}