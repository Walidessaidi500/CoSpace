import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-sidebar-admin',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './sidebar-admin.component.html',
})
export class SidebarAdminComponent { }
