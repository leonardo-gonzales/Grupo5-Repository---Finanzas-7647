import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <header class="tortishop-header">
      <div class="brand">
        <span class="logo">🥐</span>
        <div>
          <strong>TortiShop</strong>
          <small>Gestión comercial y créditos</small>
        </div>
      </div>
    </header>

    <main class="tortishop-main">
      <router-outlet />
    </main>

    <footer class="tortishop-footer">
      © 2026 TortiShop · Sistema de gestión comercial
    </footer>
  `,
  styles: [`
    :host {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    .tortishop-header {
      height: 68px;
      flex: 0 0 68px;
      display: flex;
      align-items: center;
      padding: 0 24px;
      background: #ffffff;
      border-bottom: 1px solid #eadfd8;
      box-shadow: 0 2px 8px rgba(31, 36, 45, 0.04);
      z-index: 100;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
      color: #c81e2b;
    }

    .brand strong,
    .brand small {
      display: block;
    }

    .brand strong {
      font-size: 1.15rem;
      line-height: 1.1;
    }

    .brand small {
      color: #5c6470;
      font-size: 0.72rem;
      margin-top: 2px;
    }

    .logo {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: #c81e2b;
      color: #ffffff;
      font-size: 1.25rem;
    }

    .tortishop-main {
      flex: 1;
      min-height: 300px;
    }

    .tortishop-footer {
      min-height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 12px 24px;
      text-align: center;
      background: #ffffff;
      border-top: 1px solid #eadfd8;
      color: #5c6470;
      font-size: 0.78rem;
    }

    @media (max-width: 960px) {
      .tortishop-header { padding: 0 16px; }
    }
  `]
})
export class AppComponent {}

