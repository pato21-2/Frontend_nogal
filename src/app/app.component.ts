import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NgxEchartsModule } from 'ngx-echarts';
import { AccesibilidadComponent } from './components/accesibilidad/accesibilidad.component';
@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    NgxEchartsModule,
    AccesibilidadComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'nogal';
}
