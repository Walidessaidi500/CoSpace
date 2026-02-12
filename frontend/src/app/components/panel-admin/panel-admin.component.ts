import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarAdminComponent } from '../sidebar-admin/sidebar-admin.component';
import { AdminService } from '../../services/admin.service';

import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-panel-admin',
    standalone: true,
    imports: [CommonModule, SidebarAdminComponent, RouterLink],
    templateUrl: './panel-admin.component.html',
})
export class PanelAdminComponent implements OnInit {
    private adminService = inject(AdminService);
    private cdr = inject(ChangeDetectorRef);

    stats: any[] = [];
    recentReservations: any[] = [];
    popularSpaces: any[] = [];

    isLoading = true;
    errorMessage: string | null = null;

    ngOnInit() {
        this.loadDashboardData();
    }

    loadDashboardData() {
        this.isLoading = true;
        this.errorMessage = null;

        console.log('PanelAdminComponent: Starting loadDashboardData');
        this.adminService.getDashboardStats().subscribe({
            next: (data) => {
                console.log('PanelAdminComponent: Data received', data);
                try {
                    this.stats = [
                        {
                            title: 'Total Usuarios',
                            value: data.stats.usuarios.value,
                            change: data.stats.usuarios.change,
                            icon: 'users',
                            color: 'bg-blue-100 text-blue-600'
                        },
                        {
                            title: 'Espacios Activos',
                            value: data.stats.espacios.value,
                            change: data.stats.espacios.change,
                            icon: 'office-building',
                            color: 'bg-orange-100 text-orange-600'
                        },
                        {
                            title: 'Reservas del Mes',
                            value: data.stats.reservas.value,
                            change: data.stats.reservas.change,
                            icon: 'calendar',
                            color: 'bg-red-100 text-red-600'
                        },
                        {
                            title: 'Ingresos del Mes',
                            value: data.stats.ingresos.value,
                            change: data.stats.ingresos.change,
                            icon: 'currency-euro',
                            color: 'bg-green-100 text-green-600'
                        },
                    ];
                    this.recentReservations = data.recentReservations;
                    this.popularSpaces = data.popularSpaces;

                    console.log('PanelAdminComponent: improved stats mapping success');
                    this.isLoading = false;
                    this.cdr.detectChanges(); // Force UI update
                } catch (error) {
                    console.error('PanelAdminComponent: Error processing data', error);
                    this.errorMessage = 'Error procesando datos del servidor.';
                    this.isLoading = false;
                    this.cdr.detectChanges();
                }
            },
            error: (err) => {
                console.error('PanelAdminComponent: Error loading dashboard stats', err);
                this.errorMessage = 'No se pudieron cargar los datos del dashboard. Por favor, inténtalo de nuevo más tarde.';
                this.isLoading = false;
                this.cdr.detectChanges();
            }
        });
    }
}
