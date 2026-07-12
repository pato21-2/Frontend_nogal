# Nogal ERP — Documento técnico de la transformación

**Alcance de esta entrega:** conversión del sistema en una plataforma ERP con módulos empresariales reales, manteniendo el 100 % de la funcionalidad existente y la compatibilidad entre frontend, backend y base de datos.

---

## 1. Análisis realizado del proyecto

**Arquitectura backend:** Spring Boot 3 / Java 17 con separación en capas (controllers → services → repositories → models JPA). Se respetó y extendió ese patrón; los módulos nuevos son 100 % aditivos (ningún archivo existente cambió de contrato).

**Hallazgos relevantes del análisis:**
- `SecurityConfig` está íntegramente comentado: **la API no tiene seguridad HTTP real** (solo BCrypt para contraseñas). Es el riesgo n.º 1 del sistema (ver roadmap §5).
- `PedidoService` ya contenía analítica parcial (tendencia 30 días, top productos); se construyó sobre esa base sin duplicarla.
- `IngresoInventarioModel` ya registraba `diasCredito` y `fechaPago` → se aprovechó para **cuentas por pagar reales**.
- `DireccionModel.distrito` existe → **ventas por distrito** posibles sin cambios de esquema.
- `ddl-auto=update` → las entidades nuevas crean sus tablas automáticamente (el repo `bdd` estaba vacío por esta razón; ahora incluye el esquema documentado).
- Frontend Angular 19 standalone con `ngx-echarts` ya configurado globalmente → el Centro BI lo reutiliza sin nuevas dependencias.

## 2. Módulos ERP implementados (funcionales de punta a punta)

### 2.1 Cotizador profesional
- **Backend:** `CotizacionModel` + `DetalleCotizacionModel` (descuento por línea y global, IGV 18 %), numeración automática `COT-AAAA-####`, vigencia con vencimiento automático, ciclo de vida BORRADOR→ENVIADA→ACEPTADA/RECHAZADA/VENCIDA→CONVERTIDA, **versionado** de documentos, **firma registrada** (nombre + fecha al aceptar) y **conversión a pedido real** reutilizando `PedidoService.crearPedido` (un solo flujo de creación de pedidos: valida y descuenta stock).
- **Frontend:** `/cotizaciones` — creación con líneas y totales en vivo, filtros por estado, acciones de ciclo de vida, modal de conversión (selecciona dirección y tarjeta del cliente) y **documento imprimible** con layout de impresión limpio (PDF vía navegador).

### 2.2 Centro de Business Intelligence (`/bi`)
8 KPIs ejecutivos (ventas hoy/mes, utilidad y margen del mes, comparativa 30 d vs. 30 d anteriores, ticket promedio, clientes nuevos/activos, stock crítico, valor de inventario) y 12 visualizaciones en 4 pestañas:
- **Ventas:** evolución diaria, comparativa mensual 12 m, top productos, donut de categorías, top clientes, ventas por distrito, radar de categorías, **mapa de calor** día×hora de pedidos.
- **Inventario:** clasificación **ABC** (80/95 por valor de venta), tabla de **alertas de reabastecimiento** con compra sugerida y costo estimado.
- **Finanzas:** **flujo de caja** ingresos vs. egresos, **cuentas por cobrar** (contraentrega no entregada) y **cuentas por pagar** (crédito a proveedores con vencimientos), compras y demora por proveedor.
- **Operación:** embudo del ciclo de pedidos, **pedidos retrasados**, **clientes inactivos** para recontacto.
Extras: exportación **CSV** por tabla e **impresión ejecutiva** del dashboard.

### 2.3 CRM (`/crm`)
- Cartera de clientes con **CLV** (valor de vida), ticket promedio, ranking y **estado comercial calculado** (POTENCIAL/NUEVO/ACTIVO/FRECUENTE/VIP/INACTIVO) a partir de reglas sobre datos reales.
- **Ficha 360** con línea de tiempo unificada: pedidos + cotizaciones + **interacciones registradas** (llamada, visita, correo, seguimiento, observación) con próxima acción — nueva entidad `InteraccionClienteModel`.

### 2.4 Asistente empresarial (`/asistente`)
Motor analítico **basado en reglas** (sin dependencias externas): interpreta la intención de la pregunta y responde con los datos reales del negocio. Cubre las preguntas del brief: qué producto vendo más, qué clientes contactar, por qué bajaron las ventas (diagnóstico multi-causa: stock crítico + clientes perdidos + retrasos), qué proveedor demora más, qué comprar esta semana (lista de compra con inversión estimada), pedidos retrasados, clientes que dejaron de comprar, productos con mayor utilidad, resumen ejecutivo y posición de cobros/pagos. *Se declara honestamente como motor de reglas, no un LLM; ver roadmap.*

### 2.5 Inventario avanzado
- Campos `stockMinimo`/`stockMaximo` en producto (compatibles, con defaults 5/50).
- Endpoint de **alertas de reabastecimiento** con sugerencia de compra hasta el máximo y costo estimado.
- **Kardex** por producto: entradas (ingresos de inventario) y salidas (ventas) cronológicas — endpoint `/api/analytics/kardex/{id}`.
- Valorización del inventario a costo y clasificación ABC.

### 2.6 Auditoría y bitácora
`AuditoriaInterceptor` registra automáticamente toda operación de escritura (POST/PUT/DELETE) con método, ruta, IP y código de respuesta, sin interrumpir jamás la operación de negocio. Consulta paginada en `/api/auditoria`.

### 2.7 PWA y UX
Manifest webmanifest (instalable, `theme_color` de marca), sobre el modo claro/oscuro, animaciones, skeleton loading y accesibilidad ya entregados en fases anteriores.

## 3. API nueva (resumen)

| Recurso | Endpoints |
|---|---|
| `/api/cotizacion` | CRUD + `/{id}/estado`, `/{id}/version`, `/{id}/convertir`, `/cliente/{id}` |
| `/api/analytics` | `kpis`, `ventas-diarias`, `ventas-mensuales`, `heatmap-pedidos`, `top-productos`, `productos-menos-vendidos`, `productos-sin-movimiento`, `top-categorias`, `top-clientes`, `ventas-por-distrito`, `top-proveedores`, `alertas-stock`, `kardex/{id}`, `abc-inventario`, `cuentas-por-cobrar`, `cuentas-por-pagar`, `flujo-caja`, `pedidos-retrasados`, `clientes-inactivos`, `embudo-pedidos` |
| `/api/crm` | `clientes`, `cliente/{id}` (360 + timeline), `interaccion` |
| `/api/auditoria` | consulta paginada de la bitácora |

## 4. Pruebas y verificación

- **JUnit + Mockito:** `CotizacionServiceTest` (7 casos: cálculo de totales e IGV, descuentos en cadena, validaciones, firma al aceptar, inmutabilidad de convertidas, bloqueo de conversión sin aceptación). Se ejecutan con `mvn test`.
- **Verificación estática realizada en este entorno** (sin acceso a red, no fue posible `mvn`/`npm`): 68 archivos Java con llaves/paréntesis/packages/nombres de clase verificados (0 problemas); 0 errores de sintaxis TypeScript en todo el frontend; plantillas balanceadas; símbolos de plantillas nuevos verificados contra sus componentes; rutas registradas. **Ejecuta `mvn test` y `ng serve` localmente como validación final.**

## 5. Roadmap recomendado (no incluido en esta entrega, por prioridad)

1. **Seguridad (crítico):** activar Spring Security con JWT + refresh token, CORS restrictivo, rate limiting y permisos por rol en endpoints (`/api/analytics` y `/api/crm` solo admin). El `SecurityConfig` comentado debe reactivarse y modernizarse.
2. **Facturación electrónica:** el modelo `Factura` existe; falta numeración por serie, notas de crédito/débito e integración SUNAT (OSE/homologación).
3. **Notificaciones:** correo transaccional (pedido creado, cotización enviada) con `spring-boot-starter-mail`; WhatsApp vía API de Meta.
4. **Asistente con LLM:** conectar el motor de reglas actual como herramientas (function calling) de un modelo de lenguaje.
5. **Logística avanzada:** rutas y confirmación con QR/foto/firma sobre el módulo repartidor existente.
6. **Multialmacén, lotes y series** en inventario; **MapStruct + DTOs** para desacoplar entidades de la API; **OpenAPI/Swagger**.

## 6. Archivos nuevos/modificados

**Backend (nuevos):** `CotizacionModel`, `DetalleCotizacionModel`, `ICotizacionRepository`, `CotizacionService`, `CotizacionController`, `AnalyticsService`, `AnalyticsController`, `InteraccionClienteModel`, `IInteraccionClienteRepository`, `CrmService`, `CrmController`, `AuditoriaModel`, `IAuditoriaRepository`, `AuditoriaInterceptor`, `AuditoriaController`, `CotizacionServiceTest`.
**Backend (modificados):** `ProductoModel` (+stockMinimo/stockMaximo), `WebConfig` (+interceptor de auditoría).
**Frontend (nuevos):** `services/erp.service.ts`, módulos `admin/bi-center`, `admin/cotizaciones`, `admin/crm`, `admin/asistente` (ts/html/css), `public/manifest.webmanifest`.
**Frontend (modificados):** `app.routes.ts` (+4 rutas lazy), `panel-admin.component.html` (+4 enlaces), `i18n.service.ts` (+claves), `index.html` (+manifest).
**BDD:** `erp-modulo.sql` (esquema documentado; opcional con `ddl-auto=update`).
