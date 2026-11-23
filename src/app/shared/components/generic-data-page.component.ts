import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { JsonDataService } from '../../core/services/json-data.service';
import { PageHeaderComponent } from './page-header/page-header.component';
import { DataTableComponent } from './data-table/data-table.component';
import { StatusBadgeComponent } from './status-badge/status-badge.component';

interface ColumnConfig {
  key: string;
  label: string;
}

@Component({
  selector: 'app-generic-data-page',
  standalone: true,
  imports: [CommonModule, PageHeaderComponent, DataTableComponent, StatusBadgeComponent],
  template: `
    <app-page-header [breadcrumb]="breadcrumb()" [title]="title()" [subtitle]="subtitle()">
      <button type="button" class="ts-btn ts-btn-primary">+ Nuevo registro</button>
    </app-page-header>

    <app-data-table [headers]="labels" [footerText]="footerText()">
      @for (row of rows(); track $index) {
        <tr>
          @for (column of columns(); track column.key) {
            <td>
              @if (isStatus(column.key)) {
                <app-status-badge [label]="display(row[column.key])" />
              } @else {
                {{ display(row[column.key]) }}
              }
            </td>
          }
        </tr>
      }
    </app-data-table>
  `
})
export class GenericDataPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly jsonService = inject(JsonDataService);

  title = signal('');
  subtitle = signal('');
  breadcrumb = signal('TortiShop');
  columns = signal<ColumnConfig[]>([]);
  rows = signal<Record<string, any>[]>([]);

  get labels(): string[] {
    return this.columns().map(column => column.label);
  }

  ngOnInit(): void {
    const data = this.route.snapshot.data;
    this.title.set(data['title'] ?? 'Gestión');
    this.subtitle.set(data['subtitle'] ?? 'Datos locales de muestra');
    this.breadcrumb.set(data['breadcrumb'] ?? 'TortiShop');
    this.columns.set(data['columns'] ?? []);

    this.jsonService.getData<Record<string, any>[] | Record<string, any>>(data['file']).subscribe(result => {
      const values = Array.isArray(result)
        ? result
        : (Object.values(result).find(value => Array.isArray(value)) as Record<string, any>[] ?? []);
      this.rows.set(values);
    });
  }

  footerText(): string {
    return `Mostrando ${this.rows().length} registros desde el archivo JSON local`;
  }

  display(value: any): string {
    if (value === null || value === undefined) return '';
    if (typeof value === 'number') return String(value);
    return String(value);
  }

  isStatus(key: string): boolean {
    return ['estado', 'estado_stock', 'estado_disponibilidad', 'estado_pago'].includes(key);
  }
}

