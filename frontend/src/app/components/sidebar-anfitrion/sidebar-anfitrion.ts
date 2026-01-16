import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-sidebar-anfitrion',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar-anfitrion.html', // Nota: sin .component.html
  styleUrls: ['./sidebar-anfitrion.css']   // Nota: sin .component.css
})
export class SidebarAnfitrionComponent {}