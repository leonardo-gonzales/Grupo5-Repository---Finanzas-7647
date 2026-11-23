import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
    selector: 'app-login-page',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="ts-login-bg">
      <div class="ts-login-card">
        <div class="ts-login-icon">🥐</div>
        <h1 class="ts-login-brand">TortiShop</h1>
        <p class="ts-login-subtitle">SISTEMA DE GESTIÓN COMERCIAL Y CRÉDITOS</p>
        <p class="ts-login-desc">Ingresa tus credenciales para acceder al panel administrativo</p>

        <form (submit)="ingresar($event)" class="ts-login-form">
          <div class="ts-field">
            <label>Correo electrónico o Usuario</label>
            <input class="ts-input" type="text" value="admin@tortishop.pe" />
          </div>

          <div class="ts-field">
            <label>Contraseña</label>
            <input class="ts-input" type="password" value="••••••••••••" />
          </div>

          <div class="ts-login-options">
            <label class="ts-check">
              <input type="checkbox" checked /> Recordarme en este equipo
            </label>
            <a href="javascript:void(0)" class="ts-link">¿Olvidaste tu contraseña?</a>
          </div>

          <button type="submit" class="ts-btn ts-btn-primary ts-btn-block">
            Iniciar sesión →
          </button>
        </form>

        <div class="ts-version-pill">
          🎓 TortiShop v2.0 — Interfaz Visual (Etapa 1)
        </div>
      </div>
    </div>
  `,
    styles: [`
    .ts-login-bg {
      min-height: 100vh;
      background: radial-gradient(circle at top, #fdf2eb 0%, #fffdf9 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .ts-login-card {
      width: 100%;
      max-width: 420px;
      background: #ffffff;
      border: 1px solid var(--ts-border);
      border-radius: var(--ts-radius-lg);
      box-shadow: var(--ts-shadow-md);
      padding: 36px 32px;
      text-align: center;
    }
    .ts-login-icon {
      width: 54px;
      height: 54px;
      margin: 0 auto 12px;
      border-radius: 14px;
      background: var(--ts-primary);
      color: #fff;
      font-size: 1.65rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .ts-login-brand {
      font-size: 1.75rem;
      font-weight: 800;
      color: var(--ts-primary);
    }
    .ts-login-subtitle {
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      color: var(--ts-text-secondary);
      margin-top: 4px;
    }
    .ts-login-desc {
      font-size: 0.85rem;
      color: var(--ts-text-muted);
      margin: 10px 0 24px;
    }
    .ts-login-form {
      text-align: left;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .ts-field label {
      display: block;
      font-size: 0.82rem;
      font-weight: 700;
      margin-bottom: 6px;
    }
    .ts-login-options {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.78rem;
    }
    .ts-check {
      display: flex;
      align-items: center;
      gap: 6px;
      color: var(--ts-text-secondary);
    }
    .ts-link {
      color: var(--ts-primary);
      font-weight: 600;
      text-decoration: none;
    }
    .ts-btn-block {
      width: 100%;
      padding: 12px;
      font-size: 0.95rem;
    }
    .ts-version-pill {
      display: inline-block;
      margin-top: 22px;
      font-size: 0.75rem;
      font-weight: 600;
      background: #eef2ff;
      color: #3730a3;
      padding: 5px 12px;
      border-radius: 99px;
    }
  `]
})
export class LoginPageComponent {
    private readonly router = inject(Router);

    ingresar(event: Event): void {
        event.preventDefault();
        this.router.navigate(['/dashboard']);
    }
}