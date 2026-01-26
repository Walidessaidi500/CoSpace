import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-espacio-card',
  imports: [],
  templateUrl: './espacio-card.component.html',
  styleUrl: './espacio-card.component.css',
})
export class EspacioCard {
  @Input() espacio: any;
}
