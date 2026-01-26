import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-footer-acciones',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './footer-acciones.component.html',
  styleUrl: './footer-acciones.component.css'
})
export class FooterAccionesComponent {
  @Output() guardar = new EventEmitter<void>();
  @Output() cancelar = new EventEmitter<void>();
}