import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-sidebar-anfitrion',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  templateUrl: './sidebar-anfitrion.component.html', // Nota: sin .component.html
  styleUrl: './sidebar-anfitrion.component.css'   // Nota: sin .component.css
})
export class SidebarAnfitrionComponent { }