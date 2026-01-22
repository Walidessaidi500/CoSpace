import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EspacioCard } from '../espacio-card/espacio-card';
import { ApiService } from '../../services/api';

@Component({
  selector: 'app-explorar',
  imports: [CommonModule, EspacioCard],
  templateUrl: './explorar.html',
  styleUrl: './explorar.css',
})
export class Explorar implements OnInit {
  private api = inject(ApiService);
  private cdr = inject(ChangeDetectorRef);

  listaEspacios: any[] = [];
  errorMessage: string = '';
  isLoading: boolean = true;

  ngOnInit() {
    this.isLoading = true;
    this.api.getEspacios().subscribe({
      next: (data: any) => {
        console.log('Espacios cargados:', data);
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
}
