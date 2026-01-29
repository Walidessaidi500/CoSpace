import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EspacioCardComponent } from '../espacio-card/espacio-card.component';
import { ApiService } from '../../services/api';

@Component({
  selector: 'app-explorar',
  standalone: true,
  imports: [CommonModule, FormsModule, EspacioCardComponent],
  templateUrl: './explorar.component.html',
  styleUrl: './explorar.component.css',
})
export class ExplorarComponent implements OnInit {
  private api = inject(ApiService);
  private cdr = inject(ChangeDetectorRef);

  listaEspacios: any[] = [];
  todosEspacios: any[] = [];
  errorMessage: string = '';
  isLoading: boolean = true;

  // Filtros
  filtroCiudad: string = '';
  filtroPrecio: string = '';
  filtroEstado: string = '';
  filtroRating: string = '';

  ngOnInit() {
    this.isLoading = true;
    this.api.getEspacios().subscribe({
      next: (data: any) => {
        console.log('Espacios cargados:', data);
        this.todosEspacios = data;
        this.listaEspacios = data;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar espacios', err);
        this.errorMessage = 'Error conectando con el servidor: ' + err.message;
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  filtrarEspacios() {
    let filtered = [...this.todosEspacios];

    // 1. Filtro por Ciudad
    if (this.filtroCiudad) {
      const ter = this.filtroCiudad.toLowerCase();
      filtered = filtered.filter(e =>
        e.ciudad && e.ciudad.toLowerCase().includes(ter)
      );
    }

    // 2. Filtro por Precio
    if (this.filtroPrecio) {
      if (this.filtroPrecio === '0-20') {
        filtered = filtered.filter(e => Number(e.precio_hora) < 20);
      } else if (this.filtroPrecio === '20-50') {
        filtered = filtered.filter(e => Number(e.precio_hora) >= 20 && Number(e.precio_hora) <= 50);
      } else if (this.filtroPrecio === '50+') {
        filtered = filtered.filter(e => Number(e.precio_hora) > 50);
      }
    }

    // 3. Filtro por Estado (Disponibilidad)
    if (this.filtroEstado) {
      filtered = filtered.filter(e => e.estado === this.filtroEstado);
    }

    // 4. Filtro por Rating (Reseñas)
    if (this.filtroRating) {
      const minRating = Number(this.filtroRating);
      filtered = filtered.filter(e => Number(e.rating_promedio) >= minRating);
    }

    this.listaEspacios = filtered;
  }
}
