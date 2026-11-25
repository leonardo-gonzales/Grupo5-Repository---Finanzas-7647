import {
  Component,
  Input,
  Output,
  EventEmitter,
  inject,
  signal,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { operacionLocal } from '../../services/local-store';
import { TORTISHOP_NAV_ITEMS, NavItem } from '../../config/navigation.config';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <aside class="ts-sidebar" [class.open]="isOpen">
      <div class="ts-brand">
        <div class="ts-logo-box">🥐</div>
        <div class="ts-brand-text">
          <span class="ts-brand-title">TortiShop</span>
          <span class="ts-brand-sub">Gestión & Créditos</span>
        </div>
      </div>

      <nav class="ts-nav">
        @for (section of sections; track section) {
          <div class="ts-nav-section">
            <span class="ts-section-label">{{ section }}</span>
            @for (item of getItemsBySection(section); track item.route) {
              <a
                [routerLink]="item.route"
                routerLinkActive="active"
                (click)="closeSidebar.emit()"
                class="ts-nav-link"
              >
                <span class="ts-nav-icon">{{ item.icon }}</span>
                <span class="ts-nav-label">{{ item.label }}</span>
                @if (item.badge) {
                  <span class="ts-nav-badge">{{ item.badge }}</span>
                }
              </a>
            }
          </div>
        }
      </nav>

      <div class="ts-sidebar-footer">
        <button type="button" (click)="salir()" class="ts-logout-link">
          <span>🚪</span>
          <span>Cerrar sesión</span>
        </button>
        <p role="alert">{{ error() }}</p>
      </div>
    </aside>
  `,
  styles: [
    `
      .ts-sidebar {
        width: var(--ts-sidebar-width);
        height: 100vh;
        position: fixed;
        top: 0;
        left: 0;
        background: var(--ts-surface);
        border-right: 1px solid var(--ts-border);
        display: flex;
        flex-direction: column;
        z-index: 40;
        transition: transform 0.25s ease;
      }
      .ts-brand {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 18px 20px;
        border-bottom: 1px solid var(--ts-border-subtle);
      }
      .ts-logo-box {
        width: 40px;
        height: 40px;
        border-radius: 10px;
        background: var(--ts-primary);
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.25rem;
      }
      .ts-brand-title {
        display: block;
        font-size: 1.15rem;
        font-weight: 800;
        color: var(--ts-primary);
        line-height: 1.1;
      }
      .ts-brand-sub {
        font-size: 0.72rem;
        color: var(--ts-text-secondary);
        font-weight: 500;
      }
      .ts-nav {
        flex: 1;
        overflow-y: auto;
        padding: 12px;
      }
      .ts-nav-section {
        margin-bottom: 14px;
      }
      .ts-section-label {
        display: block;
        font-size: 0.68rem;
        font-weight: 700;
        letter-spacing: 0.06em;
        color: var(--ts-text-muted);
        padding: 4px 12px 6px;
      }
      .ts-nav-link {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 9px 12px;
        border-radius: var(--ts-radius-sm);
        color: var(--ts-text-secondary);
        text-decoration: none;
        font-size: 0.85rem;
        font-weight: 600;
        margin-bottom: 2px;
        transition: all 0.16s ease;
      }
      .ts-nav-link:hover {
        background: var(--ts-accent-cream);
        color: var(--ts-text-main);
      }
      .ts-nav-link.active {
        background: var(--ts-primary-soft);
        color: var(--ts-primary);
      }
      .ts-nav-icon {
        font-size: 1rem;
        width: 20px;
        text-align: center;
      }
      .ts-nav-label {
        flex: 1;
      }
      .ts-nav-badge {
        font-size: 0.65rem;
        padding: 2px 6px;
        border-radius: 99px;
        background: var(--ts-warning-bg);
        color: var(--ts-warning-text);
        font-weight: 700;
      }
      .ts-sidebar-footer {
        padding: 14px 16px;
        border-top: 1px solid var(--ts-border-subtle);
      }
      .ts-logout-link {
        display: flex;
        background: transparent;
        border: 0;
        width: 100%;
        cursor: pointer;
        text-align: left;
        align-items: center;
        gap: 10px;
        padding: 9px 12px;
        border-radius: var(--ts-radius-sm);
        color: var(--ts-danger-text);
        text-decoration: none;
        font-size: 0.85rem;
        font-weight: 600;
        transition: background 0.16s ease;
      }
      .ts-logout-link:hover {
        background: var(--ts-danger-bg);
      }
      @media (max-width: 960px) {
        .ts-sidebar {
          transform: translateX(-100%);
        }
        .ts-sidebar.open {
          transform: translateX(0);
        }
      }
    `,
  ],
})
export class SidebarComponent {
  @Input() isOpen = false;
  @Output() closeSidebar = new EventEmitter<void>();

  cdr = inject(ChangeDetectorRef);
  navItems = [
    ...TORTISHOP_NAV_ITEMS,
    { label: 'Estado de cuenta y usuarios', route: '/gestion', icon: '📋', section: 'PRINCIPAL' },
  ];
  constructor() {
    void operacionLocal<any>('/session')
      .then((p) => {
        if (p.rol !== 'negocio') {
          this.navItems = [
            {
              label: p.rol === 'sistema' ? 'Negocios' : 'Mi cuenta',
              route: '/gestion',
              icon: '📋',
              section: 'PRINCIPAL',
            },
          ];
          this.cdr.markForCheck();
        }
      })
      .catch(() => {});
  }
  sections = ['PRINCIPAL', 'OPERACIÓN COMERCIAL', 'CATÁLOGO Y RED', 'CRÉDITOS Y CUENTAS'];

  router = inject(Router);
  error = signal('');
  async salir() {
    try {
      await operacionLocal('/logout', 'POST', {});
      await this.router.navigate(['/login']);
    } catch (e) {
      this.error.set((e as Error).message);
    }
  }
  getItemsBySection(section: string): NavItem[] {
    return this.navItems.filter((item) => item.section === section);
  }
}
