import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { routes } from './app.routes';

// Angular 22 es zoneless por defecto: NO usar provideZoneChangeDetection
// (requiere zone.js, que este proyecto no tiene instalado).
export const appConfig: ApplicationConfig = {
  providers: [provideRouter(routes), provideHttpClient()]
};
