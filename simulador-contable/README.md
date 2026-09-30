# Partida Doble · Simulador contable y administrativo

Simulador para practicar el **ciclo contable** y preparar pruebas técnicas de auxiliar, asistente o analista contable en Colombia (NIIF para Pymes, parámetros DIAN 2026). El primer objetivo es la prueba de **MTS Consultoría + Gestión S.A.S.** (30 de septiembre de 2026, 10:00 a. m., 2 horas, con calculadora).

Es **un solo archivo** (`index.html`): HTML, CSS y JavaScript sin servidor ni librerías obligatorias.

---

## 1. Cómo abrirlo

| Dónde | Cómo |
|---|---|
| Computador | Doble clic en `simulador-contable/index.html`. Abre en cualquier navegador moderno (Chrome, Edge, Firefox, Safari). No necesita internet (sin internet usa las fuentes del sistema). |
| Celular | Desde GitHub Pages: `https://idesteban.github.io/Educaci-n-profesional-/` (redirige al simulador). Ver cómo activarlo abajo. |

**Activar GitHub Pages (una sola vez, 1 minuto):**

1. En GitHub, abre el repositorio y ve a **Settings → Pages**.
2. En **Build and deployment → Source**, elige **Deploy from a branch**.
3. En **Branch**, elige la rama donde está el simulador (`claude/gallant-thompson-hzlxvp`, o `main` si ya la fusionaste) y la carpeta **/ (root)**. Pulsa **Save**.
4. En 1 o 2 minutos queda publicado en `https://idesteban.github.io/Educaci-n-profesional-/simulador-contable/`.

El archivo `index.html` de la raíz solo redirige al simulador y `.nojekyll` hace que GitHub publique los archivos tal cual.

Tu progreso se guarda **en el navegador** (localStorage). El celular y el computador llevan progresos separados.

---

## 2. Qué trae y en qué orden usarlo

| Módulo | Para qué sirve |
|---|---|
| **Diagnóstico inicial** (primera vez) | 21 ítems de las 10 etapas del ciclo contable, de menor a mayor dificultad (20–25 min). Al final: mapa por etapa en rojo (repasar desde cero), amarillo (reforzar) o verde (dominado), y tu ruta de estudio empezando por lo más débil. |
| **Mi ruta** | Cada etapa tiene 4 pasos: *repaso express* (ejemplo resuelto), *ejercicio guiado* (con pistas y cuentas sugeridas), *ejercicio independiente* (valores nuevos, un intento) y *mini evaluación* (5 ítems). Se avanza con 80 %. Tres aciertos seguidos suben la dificultad; dos fallos seguidos la bajan y dan una pista. |
| **Mes completo** | El ejercicio estrella: una empresa de propiedades y parqueaderos en Bogotá con saldos iniciales y 22 transacciones. Recorres libro diario, cuentas T, balance de prueba, ajustes y provisiones, conciliación bancaria, balance ajustado, estados financieros e informe de cuentas por pagar y por cobrar. Cada etapa se califica por separado y te dice dónde te equivocaste. Tiene versiones A, B y C, más un modo aleatorio. |
| **Simulacro MTS** | 2 horas: 13 ejercicios del ciclo contable (70 %) y 15 preguntas (30 %). Sin retroalimentación hasta entregar. Al final: puntaje total y por tema, tiempo usado, revisión de cada ítem y el botón “Practicar mis errores”. También hay un **simulacro rápido** de 20 preguntas en 30 minutos. |
| **Datos clave** | Parámetros 2026 editables (UVT, SMMLV, bases y tarifas de retención, nómina) con el aviso “verifica la norma vigente” y buscador del PUC. |
| **Calculadora** | Botón flotante con cinta de sumadora. Acepta operaciones como `1.850.000*19%` y pone el resultado en la casilla activa. |

**Plan sugerido para la noche antes de la prueba:** diagnóstico → etapas 3, 6 y 7 de la ruta → Mes completo versión A → simulacro (MTS si tienes 2 horas, rápido si no) → repasar errores.

### Cómo se califica

- Valores con tolerancia de **± $2**. En las casillas puedes escribir `1.414.098`, `1414098` o una operación como `=1850000*19%`.
- Asientos: se revisa que débitos = créditos, cuentas correctas (4 dígitos; también acepta subcuentas de 6), valores y lado.
  - **Verde:** línea correcta.
  - **Rojo:** cuenta que no corresponde o valor incorrecto.
  - **Amarillo:** cuenta correcta en el lado equivocado.
- Se aceptan imputaciones equivalentes razonables. Por ejemplo, 2205 o 2335 para servicios, 5305 o 5115 para el GMF, 2370 o 2380 para la pensión y 2610 o 2510–2525 para prestaciones. También se puede partir una cuenta en varias líneas.
- Los errores se guardan solos y vuelven en “Practicar mis errores” hasta acertarlos dos veces seguidas.

---

## 3. Decisiones normativas (verificar antes de la prueba)

Los valores dudosos quedaron como **parámetros editables** marcados con la etiqueta **Verificar** en “Datos clave”:

| Tema | Qué hace el simulador | Por qué |
|---|---|---|
| Bases mínimas | Retiene si la base es **igual o superior** a 27 UVT ($ 1.414.098) en compras o a 4 UVT ($ 209.496) en servicios. | Así lo dice el DUR 1625 de 2016 (“iguales o superiores”). El Decreto 572 de 2025 está suspendido desde el 8 de mayo de 2026. |
| Arrendamiento de inmuebles | Base mínima de 27 UVT y tarifa del 3,5 %. | El prompt no traía base; el DUR 1625 fija 27 UVT. Si en tu caso no aplica, pon 0 en “Datos clave”. |
| ReteIVA y ReteICA | Usan las mismas bases mínimas (27 / 4 UVT). Se puede desactivar. | Criterio del DUR 1625 (reteIVA) y de Bogotá (reteICA). En los ejercicios la tarifa de ReteICA siempre viene en el enunciado. |
| Honorarios a persona natural | 10 %, y la tarifa se da en el enunciado. | La norma prevé 10 %, 11 % o la tabla del art. 383, según el caso. |
| Intereses sobre cesantías | 1 % mensual de la base (salario + auxilio). | También se acepta cesantías × 12 %, porque los dos métodos se usan. |
| Aportes a seguridad social | Valor exacto al peso. | También se acepta el redondeo PILA al múltiplo de $ 100 superior. |
| Retención por ventas con datáfono | 1,5 % sobre el valor sin IVA y reteIVA 15 %; solo en nivel 3. | Verifica la tarifa vigente de la red de pagos. |

---

## 4. Cómo agregar contenido

Todo lo editable está en el primer bloque del archivo: `<script id="datos">`. El motor (`<script id="motor">`) y la interfaz (`<script id="interfaz">`) solo leen esos objetos.

### Agregar preguntas de selección múltiple

Añade objetos al arreglo `PREGUNTAS`:

```js
{ id: 'IM18',            // único
  t: 'impuestos',        // tema: uno de los id de TEMAS
  e: 3,                  // opcional: etapa del ciclo (1–10) para diagnóstico y mini evaluaciones
  mts: 1,                // opcional: etiqueta MTS
  q: 'Pregunta…',
  o: ['Opción A', 'Opción B', 'Opción C', 'Opción D'],   // exactamente 4
  r: 0,                  // índice de la correcta (las opciones se barajan al mostrarlas)
  x: 'Explicación corta, con el asiento si aplica.' }
```

### Agregar un tema o un área nueva (por ejemplo, concursos públicos)

1. Agrega el tema en `TEMAS`, por ejemplo `{ id: 'cnsc', nombre: 'Concursos CNSC' }`.
2. Agrega sus preguntas con `t: 'cnsc'`.
3. Si quieres un simulacro propio, agrega una entrada en `SIMULACROS`:

   ```js
   cnsc: { nombre: 'Simulacro CNSC', minutos: 60, pesoEjercicios: 0, pesoPreguntas: 1,
           descripcion: '…', ejercicios: [], preguntasTotal: 40 }
   ```

   Aparece solo en la pantalla de simulacros.

### Agregar un ejercicio numérico nuevo

En el bloque motor, dentro de `GENERADORES`, crea una entrada con `crear(r, nivel)`. `r` da valores al azar reproducibles: `r.monto(min, max, paso)`, `r.elegir([...])`, `r.si(prob)`.

La función devuelve:

- `enunciado` (HTML);
- `campos`: `[{ id, etiqueta, valor, alt?, pista? }]`, o `{ tipo: 'opcion', ops: [...], ok }` para elegir una opción;
- `asientos`: `[asiento(titulo, fecha, [D('5135', valor), H('2335', valor, { eq: ['2205'] })])]`;
- `solucion` (HTML).

Después úsalo en `ETAPAS` (listas `guiado`, `independiente` y `mini.gens`) o en `SIMULACROS`.

### Agregar repasos a una etapa

En `ETAPAS[n].repaso` agrega:

```js
{ titulo, concepto: '<p>HTML</p>', enunciado, pasos: ['…'], asiento: [['5105', 1000, 0], ['2610', 0, 1000]], nota }
```

Cada vez que la persona falla la mini evaluación, vuelve al repaso con el siguiente ejemplo.

### Agregar una versión del caso Mes completo

Agrega a `MES_VERSIONES` un objeto `{ id: 'D', nombre: 'Versión D', empresa, nit, anio, mes, semilla }`. La semilla fija las cifras; todas las etapas se recalculan solas y siempre cuadran.

### Agregar un módulo al menú

Agrega la entrada en `MODULOS` y registra su función de vista en `VISTAS` (bloque interfaz). La función recibe el contenedor y el parámetro de la URL (`#modulo-parametro`).

### Cambiar la prueba objetivo

Edita `CONFIG.prueba` (nombre, empresa, fecha y hora). La cuenta regresiva y el plan del tablero se ajustan solos.

---

## 5. Pruebas de calidad

Antes de cada cambio corre, desde la raíz del repositorio:

```bash
node simulador-contable/pruebas/verificar-calculos.js     # cálculos contables y asientos
node simulador-contable/pruebas/prueba-interfaz.js         # opcional: recorre la interfaz en Chromium (requiere Playwright)
```

`verificar-calculos.js` revisa:

- valores conocidos: UVT, bases de 27 y 4 UVT, IVA, retenciones, nómina del SMMLV, depreciación y conciliación;
- que las respuestas del banco de preguntas coincidan con esos cálculos;
- más de 20.000 ejercicios aleatorios: cada asiento cuadra, las cuentas existen y la solución obtiene 100 %;
- las versiones del Mes completo más 300 casos aleatorios: balance cuadrado, Activo = Pasivo + Patrimonio, conciliación igual por ambos lados y auxiliares por tercero iguales al mayor.
