import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarAnfitrionComponent } from '../../components/sidebar-anfitrion/sidebar-anfitrion';
import { ListaMisAreasComponent } from '../../components/lista-mis-areas/lista-mis-areas';

@Component({
    selector: 'app-mis-areas-page',
    standalone: true,
    imports: [CommonModule, SidebarAnfitrionComponent, ListaMisAreasComponent],
    templateUrl: './mis-areas-page.html'
})
export class MisAreasPageComponent {
    // La lógica se ha movido al componente ListaMisAreasComponent
    constructor() { }
}

