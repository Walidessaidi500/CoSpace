import { Component, inject, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
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
export class PanelAdminComponent implements OnInit, OnDestroy {
    private adminService = inject(AdminService);
    private cdr = inject(ChangeDetectorRef);

    stats: any[] = [];
    recentReservations: any[] = [];
    popularSpaces: any[] = [];

    isLoading = true;
    errorMessage: string | null = null;

    private pollingInterval: any = null;

    ngOnInit() {
        this.loadDashboardData();
        // Polling cada 10 segundos para datos en tiempo real
        this.pollingInterval = setInterval(() => {
            this.refreshData();
        }, 10000);
    }

    ngOnDestroy() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
    }

    /** Carga inicial con indicador de carga */
    loadDashboardData() {
        this.isLoading = true;
        this.errorMessage = null;
        this.fetchData();
    }

    /** Refresco silencioso (sin indicador de carga) */
    refreshData() {
        this.fetchData();
    }

    private fetchData() {
        this.adminService.getDashboardStats().subscribe({
            next: (data) => {
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

                    this.isLoading = false;
                    this.cdr.detectChanges();
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
