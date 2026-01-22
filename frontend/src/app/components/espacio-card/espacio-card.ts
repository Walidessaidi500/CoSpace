import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-espacio-card',
  imports: [],
  templateUrl: './espacio-card.html',
  styleUrl: './espacio-card.css',
})
export class EspacioCard {
  @Input() espacio: any;
}
