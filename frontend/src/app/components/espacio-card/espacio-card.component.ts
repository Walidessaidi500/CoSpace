import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-espacio-card',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './espacio-card.component.html',
  styleUrl: './espacio-card.component.css',
})
export class EspacioCardComponent {
  @Input() espacio: any;

  getFullUrl(path: string | null): string {
    if (!path) return 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80';
    if (path.startsWith('http')) return path;
    return `http://127.0.0.1:8000${path}`;
  }
}
