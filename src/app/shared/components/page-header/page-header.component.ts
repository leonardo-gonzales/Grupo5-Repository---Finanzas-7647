import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-page-header',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="ts-page-header">
      <div>
        @if (breadcrumb) {
          <span class="ts-breadcrumb">{{ breadcrumb }}</span>
        }
        <h1 class="ts-page-title">{{ title }}</h1>
        @if (subtitle) {
          <p class="ts-page-subtitle">{{ subtitle }}</p>
        }
      </div>
      <div class="ts-page-actions">
        <ng-content />
      </div>
    </div>
  `,
    styles: [`
    .ts-page-header {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 22px;
    }
    .ts-breadcrumb {
      display: block;
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.05em;
      color: var(--ts-primary);
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .ts-page-title {
      font-size: 1.55rem;
      font-weight: 800;
      color: var(--ts-text-main);
      line-height: 1.2;
    }
    .ts-page-subtitle {
      font-size: 0.875rem;
      color: var(--ts-text-secondary);
      margin-top: 4px;
    }
    .ts-page-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }
  `]
})
export class PageHeaderComponent {
    @Input() breadcrumb = '';
    @Input() title = '';
    @Input() subtitle = '';
}