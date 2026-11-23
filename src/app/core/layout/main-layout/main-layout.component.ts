import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { TopbarComponent } from '../topbar/topbar.component';

@Component({
    selector: 'app-main-layout',
    standalone: true,
    imports: [CommonModule, RouterOutlet, SidebarComponent, TopbarComponent],
    template: `
    <div class="ts-shell">
      <app-sidebar [isOpen]="sidebarOpen()" (closeSidebar)="sidebarOpen.set(false)" />
      @if (sidebarOpen()) {
        <div class="ts-backdrop" (click)="sidebarOpen.set(false)"></div>
      }
      <div class="ts-main-area">
        <app-topbar (toggleSidebar)="sidebarOpen.set(!sidebarOpen())" />
        <main class="ts-content">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
    styles: [`
    .ts-shell {
      min-height: 100vh;
      display: flex;
    }
    .ts-main-area {
      flex: 1;
      margin-left: var(--ts-sidebar-width);
      display: flex;
      flex-direction: column;
      min-width: 0;
    }
    .ts-content {
      padding: 24px 28px;
      max-width: 1400px;
      width: 100%;
      margin: 0 auto;
    }
    .ts-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.35);
      z-index: 35;
    }
    @media (max-width: 960px) {
      .ts-main-area { margin-left: 0; }
      .ts-content { padding: 16px; }
    }
  `]
})
export class MainLayoutComponent {
    sidebarOpen = signal(false);
}