import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-footer-acciones',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './footer-acciones.html',
  styleUrls: ['./footer-acciones.css']
})
export class FooterAccionesComponent {
  @Output() guardar = new EventEmitter<void>();
  @Output() cancelar = new EventEmitter<void>();
}