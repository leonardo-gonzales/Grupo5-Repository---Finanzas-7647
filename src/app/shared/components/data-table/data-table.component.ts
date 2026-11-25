import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-data-table',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="ts-table-wrapper">
      <table class="ts-table">
        <thead>
          <tr>
            @for (col of headers; track col) {
              <th>{{ col }}</th>
            }
          </tr>
        </thead>
        <tbody>
          <ng-content />
        </tbody>
      </table>
      @if (footerText) {
        <div class="ts-table-footer">
          <span>{{ footerText }}</span>

        </div>
      }
    </div>
  `,
    styles: [`
    .ts-table-wrapper {
      background: var(--ts-surface);
      border: 1px solid var(--ts-border);
      border-radius: var(--ts-radius-md);
      overflow-x: auto;
      box-shadow: var(--ts-shadow-sm);
    }
    .ts-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 0.875rem;
    }
    .ts-table thead th {
      background: var(--ts-accent-cream);
      color: var(--ts-text-secondary);
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      padding: 13px 16px;
      border-bottom: 1px solid var(--ts-border);
      white-space: nowrap;
    }
    :host ::ng-deep .ts-table tbody td {
      padding: 14px 16px;
      border-bottom: 1px solid var(--ts-border-subtle);
      color: var(--ts-text-main);
      vertical-align: middle;
    }
    :host ::ng-deep .ts-table tbody tr:hover {
      background-color: #fffaf5;
    }
    .ts-table-footer {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      background: #fcfaf8;
      font-size: 0.8rem;
      color: var(--ts-text-secondary);
    }
    .ts-pagination-visual {
      display: flex;
      gap: 6px;
    }
    .ts-pagination-visual .ts-btn {
      padding: 6px 12px;
      font-size: 0.78rem;
    }
  `]
})
export class DataTableComponent {
    @Input() headers: string[] = [];
    @Input() footerText = '';
}