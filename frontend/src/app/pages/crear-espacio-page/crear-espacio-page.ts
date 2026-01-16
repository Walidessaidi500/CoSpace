import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

// Imports de tus componentes
import { SidebarAnfitrionComponent } from '../../components/sidebar-anfitrion/sidebar-anfitrion';
import { FormularioEspacioComponent } from '../../components/formulario-espacio/formulario-espacio';
import { FooterAccionesComponent } from '../../components/footer-acciones/footer-acciones';
import { EspaciosService } from '../../services/espacios';

@Component({
  selector: 'app-crear-espacio-page',
  standalone: true,
  imports: [
    CommonModule,
    SidebarAnfitrionComponent,
    FormularioEspacioComponent,
    FooterAccionesComponent
  ],
  templateUrl: './crear-espacio-page.html'
  // Nota: Si no tienes archivo .css para esta página, borra la línea de styleUrls
})
export class CrearEspacioPageComponent {
  // ViewChild busca el componente hijo para poder leer sus datos
  @ViewChild(FormularioEspacioComponent) formularioComponent!: FormularioEspacioComponent;

  constructor(private espaciosService: EspaciosService, private router: Router) { }

  // ESTA es la función que el HTML estaba buscando y no encontraba
  onGuardar() {
    if (this.formularioComponent && this.formularioComponent.espacioForm.valid) {
      // Usamos getFormData() para incluir las imágenes
      const formData = this.formularioComponent.getFormData();

      this.espaciosService.crearEspacio(formData).subscribe({
        next: () => {
          alert('¡Espacio creado correctamente!');
          this.router.navigate(['/anfitrion/mis-areas']);
        },
        error: (err: any) => alert('Error: ' + err.message)
      });
    } else {
      // Si el componente formulario existe, marcamos los errores
      if (this.formularioComponent) {
        this.formularioComponent.espacioForm.markAllAsTouched();
      }
      alert('Por favor, revisa los campos obligatorios.');
    }
  }

  // ESTA es la función correcta para cancelar
  onCancelar() {
    this.router.navigate(['/anfitrion/mis-areas']); // O a donde quieras redirigir
  }
}