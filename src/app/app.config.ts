import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, Route } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideAnimations } from '@angular/platform-browser/animations';

import { routes } from './app.routes';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideStore } from '@ngxs/store';
import { provideToastr } from 'ngx-toastr';
import { maisonRoutes } from './maison-shell.routes';

const ROUTES = [
  {
    path: '',
    children: maisonRoutes,
  }
] satisfies Route[];

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(ROUTES),
    provideHttpClient(withFetch()),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimations(),
    provideAnimationsAsync(),
    provideStore(),
    provideToastr()
  ]
};
