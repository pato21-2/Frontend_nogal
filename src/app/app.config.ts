import { ApplicationConfig, importProvidersFrom, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { routes } from './app.routes';
import { HttpClientModule, provideHttpClient, withFetch } from '@angular/common/http';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';

// ✅ IMPORTAR CORRECTAMENTE para ngx-echarts v19
import { NgxEchartsModule } from 'ngx-echarts';


export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }), 
    provideRouter(routes, withComponentInputBinding()),
    importProvidersFrom(
      HttpClientModule,
      NgxEchartsModule.forRoot({ // ✅ FORMA CORRECTA
        echarts: () => import('echarts')
      })
    ),
    provideHttpClient(withFetch()),
    provideClientHydration(withEventReplay())
  ]
};