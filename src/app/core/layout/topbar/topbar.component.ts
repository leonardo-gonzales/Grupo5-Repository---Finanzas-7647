import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-topbar',
    standalone: true,
    imports: [CommonModule],
    template: `
    <header class="ts-topbar">
      <div class="ts-topbar-left">
        <button class="ts-menu-btn" (click)="toggleSidebar.emit()" aria-label="Menú">
          ☰
        </button>
        <span class="ts-env-title">PANEL ADMINISTRATIVO · TORTISHOP</span>
        <span class="ts-json-pill">Modo Visual (JSON Local)</span>
      </div>

      <div class="ts-topbar-right">
        <select class="ts-select ts-branch-select" aria-label="Sucursal activa">
          <option>🏪 Sucursal Central (Surco)</option>
          <option>🏪 Sucursal Caminos del Inca</option>
          <option>🏪 Sucursal Higuereta</option>
        </select>

        <div class="ts-user-info">
          <div class="ts-user-text">
            <span class="ts-user-name">Prof. Luis Tello</span>
            <span class="ts-user-role">Administrador</span>
          </div>
          <div class="ts-avatar">LT</div>
        </div>
      </div>
    </header>
  `,
    styles: [`
    .ts-topbar {
      height: var(--ts-topbar-height);
      background: var(--ts-surface);
      border-bottom: 1px solid var(--ts-border);
      padding: 0 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: sticky;
      top: 0;
      z-index: 30;
    }
    .ts-topbar-left, .ts-topbar-right {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .ts-menu-btn {
      display: none;
      background: var(--ts-accent-cream);
      border: 1px solid var(--ts-border);
      border-radius: 8px;
      padding: 6px 10px;
      font-size: 1.1rem;
      cursor: pointer;
    }
    .ts-env-title {
      font-size: 0.78rem;
      font-weight: 700;
      letter-spacing: 0.05em;
      color: var(--ts-text-secondary);
    }
    .ts-json-pill {
      font-size: 0.72rem;
      font-weight: 700;
      background: var(--ts-accent-cream);
      color: var(--ts-primary);
      border: 1px solid var(--ts-border);
      padding: 3px 10px;
      border-radius: 99px;
    }
    .ts-branch-select {
      width: auto;
      padding: 7px 12px;
      font-size: 0.8rem;
      font-weight: 600;
    }
    .ts-user-info {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .ts-user-text {
      text-align: right;
    }
    .ts-user-name {
      display: block;
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--ts-text-main);
    }
    .ts-user-role {
      display: block;
      font-size: 0.72rem;
      color: var(--ts-text-muted);
    }
    .ts-avatar {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      background: var(--ts-primary);
      color: #fff;
      font-weight: 700;
      font-size: 0.85rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    @media (max-width: 960px) {
      .ts-menu-btn { display: inline-flex; }
      .ts-env-title, .ts-user-text { display: none; }
    }
  `]
})
export class TopbarComponent {
    @Output() toggleSidebar = new EventEmitter<void>();
}