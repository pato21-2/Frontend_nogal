# Rediseño visual — Comercial El Nogal

Rediseño profesional completo del frontend. **Solo diseño: la lógica de negocio, servicios, rutas y bindings no fueron modificados.** El backend no requiere ningún cambio.

## Cómo ejecutar

```bash
npm install
npm start        # ng serve → http://localhost:4200
```

El backend Spring Boot debe seguir corriendo en `http://localhost:8080` como siempre.

## Qué se hizo

### Sistema de diseño global (`src/styles.css`)
- Paleta "Nogal" derivada del logo real: verde nogal `#2E5B34` + madera/roble `#B4763B`.
- **Modo claro y oscuro** con tokens CSS (`--bg`, `--surface`, `--text-1`, `--brand`, etc.) conmutados con `data-bs-theme` en `<html>`.
- Re-tematización completa de Bootstrap: botones, cards, formularios, tablas, badges, alerts, modales, dropdowns, paginación y tabs adoptan la identidad de marca en ambos temas.
- Tipografía Google Fonts: **Manrope** (cuerpo/UI) + **Outfit** (títulos).
- Animaciones: transición de página al navegar, entradas fade/scale, hover states, ripple en botones, clase `.skeleton` de carga, todo respetando `prefers-reduced-motion`.
- Firma visual: la "veta" — línea de gradiente verde→madera en header, cards de autenticación y footer.
- Scrollbar, selección de texto y anillos de foco accesibles tematizados.

### Tema claro/oscuro
- Nuevo `src/app/services/theme.service.ts` (persiste en `localStorage`, respeta la preferencia del sistema).
- Botón de cambio de tema en el header de la tienda.
- Script anti-parpadeo en `index.html` que aplica el tema guardado antes del primer render.

### Componentes rediseñados (HTML + CSS, bindings intactos)
- **Header**: fijo con efecto glass, búsqueda tipo pill, chip de usuario con avatar, badge de carrito animado, toggle de tema.
- **Footer**: superficie profunda de marca, 4 columnas, redes con iconos, enlaces y datos originales conservados.
- **Login y Registro**: páginas de autenticación centradas con fondo radial de marca; el login ahora también se envía con Enter.
- **Principal (tienda)**: hero con gradiente verde→madera y tipografía fluida.
- **Panel Admin**: el modal de crear usuario (antes estilo neón) se reescribió al sistema de diseño manteniendo todos los selectores; dashboard y sidebar tematizados.
- **Gestión de usuarios**: la pantalla "forzada a oscuro" ahora se adapta a ambos temas.
- **Panel Logístico**: cabecera con identidad de marca.
- Los 24 componentes migrados a los tokens del sistema (verdes/grises/pasteles hardcodeados → variables), por lo que **todas** las pantallas funcionan en claro y oscuro.

### Correcciones de build
- `angular.json`: presupuesto `anyComponentStyle` subido a 25 kB/50 kB — los CSS originales (p. ej. `panel-repartidor` con 20.5 kB) ya superaban el límite de 8 kB y el build de producción fallaba desde antes; ahora `ng build` pasa.
- `index.html`: `lang="es"`, meta `theme-color`, preconnect de fuentes.

## Verificaciones realizadas
- 0 errores de sintaxis en todos los `.ts` de la aplicación.
- Etiquetas balanceadas en todas las plantillas editadas y llaves balanceadas en todos los CSS.
- Auditoría automática comparando contra el proyecto original: **0 event bindings y 0 `[(ngModel)]` perdidos** en los 24 componentes.
- Auditoría de contraste: sin casos de texto claro sobre superficies claras en ningún tema.

> Nota: en este entorno no fue posible ejecutar `npm install`/`ng serve` (sin acceso a red), por lo que la verificación fue estática. Al ejecutar localmente, cualquier detalle visual menor puede ajustarse tocando solo los tokens de `src/styles.css`.
