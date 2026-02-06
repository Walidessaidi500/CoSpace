import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarAnfitrionComponent } from '../sidebar-anfitrion/sidebar-anfitrion.component';
import { ListaMisAreasComponent } from '../lista-mis-areas/lista-mis-areas.component';

@Component({
    selector: 'app-mis-areas',
    standalone: true,
    imports: [CommonModule, SidebarAnfitrionComponent, ListaMisAreasComponent],
    templateUrl: './mis-areas.component.html'
})
export class MisAreasComponent {
    // La lógica se ha movido al componente ListaMisAreasComponent
    constructor() {
        // Force rebuild 2
    }
}

