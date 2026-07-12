// app.module.ts - ACTUALIZADO
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { LoginComponent } from './login/login.component';
import { RegistroComponent } from './registro/registro.component';
import { PrincipalComponent } from './principal/principal.component';
import { PanelLogisticoComponent } from './logistico/panel-logistico/panel-logistico.component';
import { PanelAdminComponent } from './admin/panel-admin/panel-admin.component';
import { CarritoComponent } from './carrito/carrito.component';
import { PerfilComponent } from './perfil/perfil.component';
import { CambiarPasswordComponent } from './perfil/cambiar-password/cambiar-password.component';
import { MisTarjetasComponent } from './perfil/mis-tarjetas/mis-tarjetas.component';

// ✅ AGREGAR COMPONENTES DEL REPARTIDOR
import { PanelRepartidorComponent } from './repartidor/panel-repartidor/panel-repartidor.component';
import { ListaPedidosComponent } from './repartidor/lista-pedidos/lista-pedidos.component';
import { ReporteEntregaComponent } from './repartidor/reporte-entrega/reporte-entrega.component';


import { NgxEchartsModule } from 'ngx-echarts';

// ✅ REMOVER AppRoutingModule si existe
// import { AppRoutingModule } from './app-routing.module';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    RegistroComponent,
    PrincipalComponent,
    PanelLogisticoComponent,
    PanelAdminComponent,
    CarritoComponent,
    PerfilComponent,
    CambiarPasswordComponent,
    MisTarjetasComponent,
    
    // ✅ AGREGAR COMPONENTES DEL REPARTIDOR
    PanelRepartidorComponent,
    ListaPedidosComponent,
    ReporteEntregaComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    FormsModule,
    // ✅ REMOVER AppRoutingModule si estaba aquí
    // AppRoutingModule
    NgxEchartsModule.forRoot({ // ✅ FORMA CORRECTA
      echarts: () => import('echarts')
    })
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }