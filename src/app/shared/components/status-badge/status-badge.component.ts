import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-status-badge',
    standalone: true,
    imports: [CommonModule],
    template: `
    <span class="ts-badge" [ngClass]="badgeType">{{ label }}</span>
  `,
    styles: [`
    .ts-badge {
      display: inline-flex;
      align-items: center;
      padding: 4px 10px;
      border-radius: 99px;
      font-size: 0.74rem;
      font-weight: 700;
      white-space: nowrap;
    }
    .success { background: var(--ts-success-bg); color: var(--ts-success-text); }
    .warning { background: var(--ts-warning-bg); color: var(--ts-warning-text); }
    .danger  { background: var(--ts-danger-bg); color: var(--ts-danger-text); }
    .neutral { background: var(--ts-neutral-bg); color: var(--ts-neutral-text); }
  `]
})
export class StatusBadgeComponent {
    @Input() label = '';

    get badgeType(): string {
        const val = this.label.toLowerCase();
        if (['activo', 'activa', 'disponible', 'pagado', 'óptimo', 'operativa', 'recibida', 'línea activa'].includes(val)) {
            return 'success';
        }
        if (['pendiente', 'stock bajo', 'en tránsito', 'mantenimiento'].includes(val)) {
            return 'warning';
        }
        if (['vencido', 'no disponible', 'agotado', 'en mora'].includes(val)) {
            return 'danger';
        }
        return 'neutral';
    }
}