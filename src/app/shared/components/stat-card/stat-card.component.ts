import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-stat-card',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="ts-card ts-stat-card" [ngClass]="'variant-' + variante">
      <div class="ts-stat-top">
        <span class="ts-stat-title">{{ titulo }}</span>
        <span class="ts-stat-icon">{{ icono }}</span>
      </div>
      <div class="ts-stat-value">{{ valor }}</div>
      @if (subtitulo) {
        <div class="ts-stat-sub">{{ subtitulo }}</div>
      }
    </div>
  `,
    styles: [`
    .ts-stat-card {
      transition: transform 0.18s ease, box-shadow 0.18s ease;
    }
    .ts-stat-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--ts-shadow-md);
    }
    .ts-stat-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }
    .ts-stat-title {
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--ts-text-secondary);
    }
    .ts-stat-icon {
      width: 34px;
      height: 34px;
      border-radius: 8px;
      background: var(--ts-accent-cream);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.05rem;
    }
    .ts-stat-value {
      font-size: 1.5rem;
      font-weight: 800;
      color: var(--ts-text-main);
    }
    .variant-primary .ts-stat-value { color: var(--ts-primary); }
    .variant-success .ts-stat-value { color: var(--ts-success-text); }
    .ts-stat-sub {
      font-size: 0.76rem;
      color: var(--ts-text-muted);
      margin-top: 4px;
    }
  `]
})
export class StatCardComponent {
    @Input() titulo = '';
    @Input() valor = '';
    @Input() subtitulo = '';
    @Input() icono = '📌';
    @Input() variante: 'primary' | 'cream' | 'success' | 'warning' = 'cream';
}