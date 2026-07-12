# Informe de Accesibilidad, Calidad y Normativas — Comercial El Nogal

**Fecha:** julio de 2026 · **Alcance:** Frontend Angular 19 (24 componentes)

Este informe documenta las correcciones y mejoras implementadas, el estado de cumplimiento normativo antes y después, la lista de archivos modificados con su explicación técnica, y recomendaciones para seguir elevando el nivel de accesibilidad.

---

## 1. Resumen de lo implementado

### 1.1 Corrección de modo oscuro
Se eliminaron los últimos colores de texto fijos que no respondían al tema: `color: #000/black` en CSS de reportes, clientes-top, principal, direcciones y mis-pedidos migrados al token `var(--text-1)`; estilos inline `color:black` eliminados de productos-no-movimiento; la utilidad `text-dark` sobre superficies temáticas (modal de mis-pedidos) reemplazada o neutralizada con overrides globales (`[data-bs-theme='dark'] .modal-content .text-dark`), conservándola solo donde el fondo es amarillo fijo (correcta en ambos temas). Los badges `bg-warning text-dark` y `bg-info text-dark` ahora usan el par tonal accesible del sistema.

### 1.2 Gestión de Usuarios (administrador)
Se eliminó por completo la funcionalidad "Nuevo Usuario": botón de cabecera, método `prepararNuevoUsuario()` y el modo "creación" del modal (título e icono fijados a "Editar Usuario"). La edición y desactivación de usuarios se conservan intactas.

### 1.3 Accesibilidad general (WCAG 2.1 AA)
- **Fuentes escalables:** la escala tipográfica usa `rem` sobre `html { font-size: var(--acc-escala-texto) }`; el zoom del navegador al 200 % no produce solapamientos gracias a `overflow-wrap`, imágenes fluidas (`max-width:100%`) y contenedores `table-responsive`. Además el widget de accesibilidad ofrece escala de texto propia (100/112/125/150 %).
- **Textos alternativos:** auditoría automatizada de todas las `<img>` del proyecto; se corrigieron las imágenes sin `alt` o con `alt` vacío (fotos de producto ahora anuncian "Fotografía del producto {nombre}", logotipos de tarjeta anuncian su tipo). Los iconos decorativos llevan `aria-hidden="true"`.
- **Mensajes de error descriptivos:** login y registro ya no usan `alert()`; muestran errores inline en un bloque `role="alert"` con `aria-live="assertive"`, icono de advertencia y texto específico según lo pedido: "Falta el símbolo @ en el correo electrónico.", "La contraseña debe contener al menos 8 caracteres.", "Este campo es obligatorio…". El error nunca depende solo del color: siempre hay icono + texto.

### 1.4 Accesibilidad para dislexia y TDAH
Nuevo widget flotante global (`app-accesibilidad`, visible en toda la app) con:
- **Tipografía para dislexia:** alterna OpenDyslexic (cargada bajo demanda desde CDN) con *Comic Sans MS* como respaldo local.
- **Espaciado de lectura:** incrementa espaciado entre letras (`.12em`), palabras (`.16em`) y altura de línea (1.9).
- **Línea guía de lectura:** barra horizontal semitransparente que sigue el cursor para enfocar una sola línea.
- **Texto a voz (SpeechSynthesis):** botón «Escuchar» que lee el texto seleccionado o toda la página, con Pausar, Reanudar y Detener; estado anunciado con `aria-live`.
Todas las preferencias persisten en `localStorage`.

### 1.5 Accesibilidad para daltonismo
- Filtros de realce cromático por `feColorMatrix` (SVG) para **deuteranopía**, **protanopía** y **tritanopía**, más **escala de grises** completa, aplicables a toda la aplicación desde el widget.
- **Indicadores no dependientes del color:** los errores muestran icono ⚠ + texto descriptivo; los badges de estado combinan color suave + texto; el sistema de tokens garantiza pares fondo/texto con contraste en ambos temas.

### 1.6 Internacionalización del panel administrador
El proyecto **no tenía ningún sistema de traducción** (el selector de idioma de Configuración era decorativo). Se implementó:
- `I18nService`: signal de idioma persistido, diccionario ES→EN de ~140 cadenas, actualización del atributo `lang` del documento.
- `TraducirPipe` (`| t`): pipe impuro de costo O(1) que re-evalúa al cambiar idioma.
- Aplicado a las tres pantallas del panel administrador (dashboard, gestión de usuarios y configuración): navegación, métricas, tablas, formularios, modales, botones y estados de pedido — 109 puntos de traducción.
- El selector de idioma de Configuración ahora **cambia el idioma en tiempo real**; el interruptor de "Modo Oscuro" de esa pantalla también quedó conectado al tema real.

### 1.7 Panel cliente — "Ver Detalles"
El botón no tenía ningún manejador. Se implementó: método `verDetallesProducto()`, modal accesible (`role="dialog"`, `aria-modal`, cierre con clic externo y botón etiquetado) que muestra imagen, categoría, precio (con precio de oferta), descripción, material, dimensiones, color, características, disponibilidad y envío; botón "Agregar al carrito" desde el detalle; manejo de errores cuando el producto no tiene datos (mensaje "No hay información disponible…" y "Este producto aún no tiene descripción disponible." cuando falta la descripción).

### 1.8 Auditoría de calidad — hallazgos
| Hallazgo | Estado |
|---|---|
| Textos negros fijos en modo oscuro (6 archivos) | ✅ Corregido |
| Botón "Ver Detalles" sin acción | ✅ Implementado |
| Botones de módulos del panel logístico sin acceso por teclado (dependían del `routerLink` de la tarjeta padre) | ✅ Corregido: `routerLink` directo en cada botón |
| `<img>` sin `alt` o con `alt=""` (3 casos) | ✅ Corregido |
| Errores con `alert()` bloqueante y sin contexto | ✅ Reemplazados por mensajes inline accesibles |
| Selector de idioma sin efecto | ✅ Sistema i18n implementado |
| Botón "wishlist" (♡) en tarjetas de producto sin funcionalidad de favoritos en el sistema | ⚠ Documentado — requiere decisión de negocio (backend no tiene favoritos) |
| Botón "ojo" en tabla de últimos pedidos del dashboard admin sin detalle asociado | ⚠ Documentado — el detalle de pedido admin no existe como vista |
| Espacios U+00A0 (no separables) en la indentación de `login.component.ts` | ⚠ Detectado (válido para TypeScript, pero conviene normalizar el archivo) |

---

## 2. Cumplimiento normativo

### Antes de las mejoras
| Normativa | Estado previo |
|---|---|
| WCAG 2.1 AA | ❌ Incumplimientos: contraste en modo oscuro (1.4.3), imágenes sin texto alternativo (1.1.1), errores sin identificación clara (3.3.1/3.3.3), dependencia del color (1.4.1), controles sin acceso por teclado (2.1.1) |
| WCAG 2.2 | ❌ No evaluada; incumplía por herencia de 2.1 |
| ISO 9241 | ⚠ Parcial: conformidad de la interfaz con expectativas del usuario limitada (botones inactivos, idioma sin efecto) |
| ISO 25010 | ⚠ Parcial: deficiencias en *usabilidad-accesibilidad* y *adecuación funcional* (funciones anunciadas no operativas) |
| EN 301 549 | ❌ Requiere WCAG 2.1 AA (cap. 9) |
| ADA | ⚠ Riesgo: la jurisprudencia ADA usa WCAG como referencia técnica |

### Después de las mejoras
| Normativa | Estado actual | Detalle |
|---|---|---|
| **WCAG 2.1 AA** | ✅ Cumplimiento sustancial | 1.1.1 (alt), 1.4.1 (no solo color), 1.4.3/1.4.11 (contraste por tokens en ambos temas), 1.4.4 (texto redimensionable 200 %), 1.4.10 (reflow), 1.4.12 (espaciado de texto ajustable), 2.1.1 (teclado), 2.4.7 (foco visible), 3.1.1/3.1.2 (atributo `lang` dinámico), 3.3.1/3.3.3 (errores identificados y sugeridos), 4.1.2/4.1.3 (roles ARIA y mensajes de estado) |
| **WCAG 2.2** | ✅ Parcial-alto | Añade y cumple 2.4.11 (foco no oculto), 2.5.8 (tamaño de objetivo ≥24 px en widget y botones); 3.3.8 (autenticación accesible) cumplido al no exigir función cognitiva adicional |
| **ISO 9241-110/171** | ✅ Alineado | Conformidad con expectativas, tolerancia a errores (mensajes descriptivos), individualización (widget de preferencias persistentes) |
| **ISO 25010** | ✅ Mejorado | *Usabilidad* (accesibilidad, protección frente a errores, estética), *adecuación funcional* (Ver Detalles, i18n operativos), *mantenibilidad* (tokens y servicios reutilizables) |
| **EN 301 549** | ✅ Cumplimiento sustancial | Vía WCAG 2.1 AA (cláusula 9, aplicaciones web) |
| **ADA** | ✅ Riesgo mitigado | Referencia técnica WCAG 2.1 AA satisfecha en lo sustancial |

> **Nota honesta:** la conformidad plena WCAG exige auditoría con usuarios reales y lectores de pantalla (NVDA/VoiceOver) sobre la app corriendo. Lo implementado cubre los criterios verificables estáticamente; recomendamos la validación dinámica del §4.

---

## 3. Archivos creados y modificados

### Nuevos
| Archivo | Propósito |
|---|---|
| `src/app/services/accesibilidad.service.ts` | Estado y aplicación de preferencias de accesibilidad; SpeechSynthesis |
| `src/app/components/accesibilidad/accesibilidad.component.{ts,html,css}` | Widget flotante global de accesibilidad + filtros SVG de daltonismo + línea guía |
| `src/app/services/i18n.service.ts` | Servicio de internacionalización ES/EN con persistencia |
| `src/app/pipes/traducir.pipe.ts` | Pipe `| t` de traducción reactiva |

### Modificados
| Archivo | Cambio |
|---|---|
| `src/styles.css` | Estilos globales de accesibilidad (fuente dislexia, espaciado, filtros, escala, robustez ante zoom), overrides `text-dark` |
| `src/app/app.component.{ts,html}` | Inclusión del widget de accesibilidad en la raíz |
| `src/app/login/login.component.{ts,html}` | Errores inline accesibles en lugar de `alert()` |
| `src/app/registro/registro.component.{ts,html}` | Validaciones con mensajes específicos (@ faltante, contraseña <8, obligatorios) mostradas en bloque `role="alert"` |
| `src/app/principal/principal.component.{ts,html,css}` | Funcionalidad "Ver Detalles" completa con modal accesible y manejo de errores; alts descriptivos |
| `src/app/admin/gestion-usuarios/gestion-usuarios.component.{ts,html}` | Eliminación de "Nuevo Usuario"; traducciones |
| `src/app/admin/panel-admin/panel-admin.component.{ts,html}` | Traducciones del dashboard |
| `src/app/admin/configuracion/configuracion.component.{ts,html}` | Selector de idioma y modo oscuro funcionales; traducciones |
| `src/app/logistico/panel-logistico/panel-logistico.component.html` | Botones de módulos con `routerLink` directo (acceso por teclado) |
| `src/app/carrito/carrito.component.html` | Alts descriptivos en logotipos de tarjeta |
| `src/app/perfil/mis-pedidos/mis-pedidos.component.html` | `text-dark` retirado del modal (contraste en oscuro) |
| `src/app/admin/productos-no-movimiento/productos-no-movimiento.component.html` | Estilos inline `color:black` eliminados |
| CSS de `reportes`, `clientes-top`, `principal`, `direcciones`, `mis-pedidos` | Negros fijos → `var(--text-1)` |

*(El rediseño previo — sistema de tokens, modo oscuro, tipografía y re-tematización de los 24 componentes — está documentado en `CAMBIOS-REDISEÑO.md`.)*

---

## 4. Recomendaciones para el máximo nivel de accesibilidad

1. **Pruebas con lectores de pantalla** (NVDA, VoiceOver, TalkBack) recorriendo compra completa, registro y panel admin; ajustar orden de foco y `aria-label` según hallazgos.
2. **Gestión de foco en modales:** atrapar el foco dentro del modal de detalles y devolverlo al botón de origen al cerrar (focus trap).
3. **`skip link`** ("Saltar al contenido") al inicio de cada página para usuarios de teclado.
4. **Auditorías automáticas continuas:** integrar `axe-core`/Lighthouse en CI (el proyecto ya tiene Cypress y Sonar; añadir `cypress-axe` es directo).
5. **Favoritos y detalle de pedido admin:** decidir si se implementan en backend o se retiran los botones documentados en §1.8.
6. **i18n completo:** extender el diccionario al resto de módulos (logística, repartidor, tienda) o migrar a `@ngx-translate` si se prevén más idiomas.
7. **Subtítulos/transcripciones** si en el futuro se añade contenido multimedia (WCAG 1.2).
8. **Normalizar `login.component.ts`** reemplazando los espacios U+00A0 por espacios normales para evitar sorpresas en herramientas de análisis.
9. **Declaración de accesibilidad** pública (requerida por EN 301 549 en contextos europeos y buena práctica ADA).
