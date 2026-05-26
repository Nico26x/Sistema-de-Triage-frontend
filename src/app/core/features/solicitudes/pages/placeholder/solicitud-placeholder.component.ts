import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-solicitud-placeholder',
  templateUrl: './solicitud-placeholder.component.html',
  styleUrls: ['./solicitud-placeholder.component.css'],
  imports: [CommonModule]
})
export class SolicitudPlaceholderComponent {
  @Input() title = '';
  @Input() description = '';
  @Input() icon = '📋';
}
