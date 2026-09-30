/* Prueba de la interfaz en un navegador real (opcional).
   Requiere Playwright:  npm i -D playwright  (o tenerlo instalado de forma global)
   Uso:  node simulador-contable/pruebas/prueba-interfaz.js [carpeta-para-capturas]
   Recorre los módulos principales en tamaño celular y computador y falla si hay errores de JavaScript. */
'use strict';
const path = require('path');
let playwright;
try { playwright = require('playwright'); } catch (e) {
  try { playwright = require(path.join(process.env.NODE_PATH || '/opt/node22/lib/node_modules', 'playwright')); } catch (e2) { console.log('Playwright no está instalado: se omite la prueba de interfaz.'); process.exit(0); }
}
const archivo = 'file://' + path.join(__dirname, '..', 'index.html');
const capturas = process.argv[2] || null;
const errores = [];
let pasos = 0;
function paso(msg) { pasos++; console.log('  ✓ ' + msg); }

async function perfecto(page, selectorItem, item) {
  // Llena un ejercicio con la respuesta correcta (usa el motor de la propia página).
  await page.evaluate(({ sel, it }) => {
    const cont = document.querySelector(sel);
    for (const c of it.campos) {
      const x = cont.querySelector(`[data-campo="${c.id}"] input, [data-campo="${c.id}"] select`);
      x.value = c.tipo === 'opcion' ? String(c.ok) : String(c.valor);
      x.dispatchEvent(new Event(x.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }));
    }
    const asientos = cont.querySelectorAll('.asiento');
    it.asientos.forEach((a, i) => {
      const caja = asientos[i];
      while (caja.querySelectorAll('.linea').length < a.lineas.length) caja.querySelector('.l-agregar').click();
      const lis = caja.querySelectorAll('.linea');
      a.lineas.forEach((l, k) => {
        const set = (cls, v) => { const x = lis[k].querySelector(cls); x.value = v; x.dispatchEvent(new Event('input', { bubbles: true })); };
        set('.l-codigo', l.c); set('.l-d', l.d ? String(l.d) : ''); set('.l-h', l.h ? String(l.h) : '');
      });
    });
  }, { sel: selectorItem, it: item });
}

async function recorrido(browser, nombre, opciones) {
  const ctx = await browser.newContext(opciones);
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errores.push(`[${nombre}] ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)/.test(m.text()) && !/ERR_(NAME|INTERNET|CONNECTION|TUNNEL|PROXY|CERT)/.test(m.text())) errores.push(`[${nombre}] consola: ${m.text()}`); });
  page.on('dialog', (d) => d.dismiss());
  const foto = async (n) => { if (capturas) await page.screenshot({ path: path.join(capturas, `${nombre}-${n}.png`), fullPage: false }); };
  await page.goto(archivo);
  await page.waitForSelector('#vista .vista');
  const txt = await page.textContent('#vista');
  if (!/Diagnóstico inicial/.test(txt)) throw new Error('La primera visita no abre el diagnóstico');
  paso(`${nombre}: la primera visita abre el diagnóstico`);
  await foto('diagnostico-intro');

  // Diagnóstico completo (respuestas perfectas en los ejercicios, primera opción en preguntas)
  await page.click('#btnEmpezar');
  const n = await page.evaluate(() => E.diagActivo.refs.length);
  for (let i = 0; i < n; i++) {
    const tipo = await page.evaluate((k) => crearItem(E.diagActivo.refs[k]).tipo, i);
    if (tipo === 'mcq') await page.click('#diagItem .opcion >> nth=0');
    else { const it = await page.evaluate((k) => crearItem(E.diagActivo.refs[k]), i); await perfecto(page, '#diagItem', it); }
    if (i === 3) await foto('diagnostico-item');
    if (i < n - 1) await page.click('#diagSig'); else await page.click('#diagFin');
  }
  await page.waitForSelector('text=Tu mapa del ciclo contable');
  const d = await page.evaluate(() => E.diag[E.diag.length - 1]);
  if (!d || Object.keys(d.porEtapa).length !== 10) throw new Error('El diagnóstico no calificó las 10 etapas');
  paso(`${nombre}: diagnóstico de ${n} ítems calificado (${Math.round(d.total * 100)} %) con mapa y ruta`);
  await foto('diagnostico-resultado');

  // Etapa 3: repaso → guiado con respuesta perfecta → avanza
  await page.goto(archivo + '#etapa-3'); await page.waitForSelector('text=Repaso express');
  await foto('etapa-repaso');
  await page.click('#btnSeguir');
  await page.waitForSelector('#ejCont .item');
  const it3 = await page.evaluate(() => crearItem(E.etapas[3].actual.ref));
  await perfecto(page, '#ejCont', it3);
  await page.click('#ejCont [data-accion="calificar"]');
  await page.waitForSelector('#btnAvanzar');
  paso(`${nombre}: ejercicio guiado (${it3.titulo}) calificado al 100 % y habilita el siguiente paso`);
  await foto('etapa-guiado');
  await page.click('#btnAvanzar');
  await page.waitForSelector('text=Ejercicio independiente:');
  // Independiente con un error a propósito: debe marcar en rojo/amarillo
  const it3b = await page.evaluate(() => crearItem(E.etapas[3].actual.ref));
  await perfecto(page, '#ejCont', it3b);
  await page.evaluate(() => { const x = document.querySelector('#ejCont .linea .l-d'); const y = document.querySelector('#ejCont .linea .l-h'); if (x.value) { y.value = x.value; x.value = ''; } else { x.value = y.value; y.value = ''; } x.dispatchEvent(new Event('input', { bubbles: true })); });
  await page.click('#ejCont [data-accion="calificar"]');
  await page.waitForSelector('#ejCont .linea.es-lado');
  paso(`${nombre}: el calificador marca en amarillo la cuenta en el lado equivocado`);
  await page.click('#ejCont [data-accion="solucion"]');
  await page.waitForSelector('#ejCont .solucion:not([hidden]) .tabla-sol');
  paso(`${nombre}: “Ver solución” muestra el asiento paso a paso`);

  // Etapas 6 y 7: repaso y ejercicio guiado se renderizan
  for (const e of [6, 7, 1, 2, 4, 5, 8, 9, 10]) {
    await page.goto(archivo + '#etapa-' + e); await page.waitForSelector('text=Repaso express');
    await page.click('#btnSeguir'); await page.waitForSelector('#ejCont .item');
    const it = await page.evaluate((k) => crearItem(E.etapas[k].actual.ref), e);
    await perfecto(page, '#ejCont', it); await page.click('#ejCont [data-accion="calificar"]'); await page.waitForSelector('#btnAvanzar');
    paso(`${nombre}: etapa ${e} – ${it.titulo} al 100 %`);
  }
  // Mini evaluación de la etapa 7 hasta el final
  await page.evaluate(() => { E.etapas[7].paso = 3; E.etapas[7].actual = null; guardarYa(); });
  await page.goto(archivo + '#etapa-7'); await page.reload(); await page.waitForSelector('text=Mini evaluación · ítem 1');
  for (let k = 0; k < 5; k++) {
    const it = await page.evaluate(() => crearItem(E.etapas[7].mini.refs[E.etapas[7].mini.i]));
    if (it.tipo === 'mcq') { await page.evaluate((r) => { const b = [...document.querySelectorAll('#miniItem .opcion')].find((x) => Number(x.dataset.o) === r); b.click(); }, it.r); }
    else { await perfecto(page, '#miniItem', it); await page.click('#miniItem [data-accion="calificar"]'); }
    await page.click('#miniSig');
  }
  await page.waitForSelector('text=¡Etapa dominada!');
  paso(`${nombre}: mini evaluación de 5 ítems aprobada y etapa 7 en verde`);

  // Mes completo versión A: todas las etapas
  await page.goto(archivo + '#mes'); await page.waitForSelector('text=Caso integrado: Mes completo');
  await foto('mes-versiones');
  await page.goto(archivo + '#mes-A'); await page.waitForSelector('.tx');
  const tx1 = await page.evaluate(() => mesDe('A').txs[1]);
  await page.click('.tx >> nth=1 >> summary');
  await page.waitForSelector('.tx >> nth=1 >> .linea');
  await page.evaluate((t) => {
    const d = document.querySelectorAll('.tx')[1];
    while (d.querySelectorAll('.linea').length < t.lineas.length) d.querySelector('.l-agregar').click();
    const lis = d.querySelectorAll('.linea');
    t.lineas.forEach((l, k) => { const s = (c, v) => { const x = lis[k].querySelector(c); x.value = v; x.dispatchEvent(new Event('input', { bubbles: true })); }; s('.l-codigo', l.c); s('.l-d', l.d ? String(l.d) : ''); s('.l-h', l.h ? String(l.h) : ''); });
  }, tx1);
  await page.click('.tx >> nth=1 >> [data-cal]');
  const pt = await page.textContent('.tx >> nth=1 >> [data-pt]');
  if (!/100/.test(pt)) throw new Error('La transacción T2 con respuesta correcta no dio 100 %: ' + pt);
  paso(`${nombre}: Mes completo – asiento T2 (facturación fija con 3 clientes) al 100 %`);
  await foto('mes-diario');
  for (const et of ['t', 'bp', 'ajustes', 'conc', 'bpa', 'eeff', 'cxpc', 'resumen']) {
    await page.click(`[data-et="${et}"]`);
    await page.waitForSelector('#mesEtapa h2');
    const cal = await page.$('[data-cal-etapa]'); if (cal) await cal.click();
    const sol = await page.$('[data-sol-etapa]'); if (sol) await sol.click();
    if (et === 't') {
      await page.click('[data-mov] >> nth=0');
      await foto('mes-cuentas-t');
    }
    if (et === 'conc') { await page.click('tr[data-m] >> nth=0'); await foto('mes-conciliacion'); }
  }
  paso(`${nombre}: Mes completo – las 8 etapas y el resumen se abren, califican y muestran solución`);

  // Simulacro rápido: responder y entregar
  await page.goto(archivo + '#simulacro-rapido'); await page.waitForSelector('#btnEmpezarSim');
  await page.click('#btnEmpezarSim'); await page.waitForSelector('#simItem .opcion');
  await foto('simulacro-curso');
  for (let k = 0; k < 3; k++) { await page.keyboard.press(String(1 + k)); await page.click('#simSig'); }
  await page.click('#simTerminar'); await page.click('#modalSi');
  await page.waitForSelector('.puntaje-circulo');
  paso(`${nombre}: simulacro rápido entregado con puntaje, tiempo y revisión`);
  await foto('simulacro-resultado');
  await page.click('#revSim details >> nth=0 >> summary'); await page.waitForSelector('#revSim .opcion.correcta');
  await page.click('#btnPracticarErr'); await page.waitForSelector('#sesItem .item');
  paso(`${nombre}: “Practicar mis errores” abre una sesión con los fallos`);

  // Práctica por tema (teclado) y repaso de errores
  await page.goto(archivo + '#practica'); await page.waitForSelector('h1:has-text("Práctica por tema")');
  await foto('practica');
  await page.click('[data-tema="impuestos"]'); await page.waitForSelector('#sesItem .opcion');
  await page.keyboard.press('1'); await page.waitForSelector('#sesItem .retro:not([hidden])');
  await page.keyboard.press('Enter'); await page.waitForSelector('text=Ítem 2 de 10');
  paso(`${nombre}: práctica por tema responde con la tecla 1 y avanza con Enter`);
  for (const caso of ['nomina', 'flujo', 'cartera']) {
    await page.goto(archivo + '#casos-' + caso); await page.waitForSelector('#casoItem .item');
    const itc = await page.evaluate((k) => crearItem(E.casos[k].ref), caso);
    await perfecto(page, '#casoItem', itc); await page.click('#casoItem [data-accion="calificar"]');
    await page.waitForSelector('#casoItem .retro.ok');
    if (caso === 'nomina') await foto('caso-nomina');
  }
  paso(`${nombre}: casos numéricos de nómina, flujo de caja y edades de cartera al 100 %`);
  await page.goto(archivo + '#errores'); await page.waitForSelector('h1:has-text("Repaso de errores")');
  const nErr = await page.evaluate(() => E.errores.length);
  await foto('errores');
  await page.click('#btnRepasar'); await page.waitForSelector('#sesItem .item');
  paso(`${nombre}: repaso de errores (${nErr} guardados) abre la sesión espaciada`);

  // Simulacro MTS: abrir cada ítem (ejercicios incluidos) y abandonar
  await page.goto(archivo + '#simulacro-mts'); await page.waitForSelector('#btnEmpezarSim');
  await page.click('#btnEmpezarSim'); await page.waitForSelector('#simItem .item');
  const total = await page.evaluate(() => E.simActivo.refs.length);
  for (let k = 1; k < total; k++) await page.click(`[data-ir="${k}"]`);
  await foto('simulacro-mts');
  paso(`${nombre}: simulacro MTS de ${total} ítems (ejercicios y preguntas) se recorre completo`);
  await page.goto(archivo + '#simulacro'); await page.click('#btnAbandonar'); await page.click('#modalSi');

  // Datos clave, calculadora, tema
  await page.goto(archivo + '#datos'); await page.waitForSelector('text=Datos clave 2026');
  await page.fill('#buscaPUC', 'retención');
  await foto('datos');
  await page.click('#calcFab'); await page.fill('#calcPantalla', '1.850.000*19%'); await page.keyboard.press('Enter');
  const cinta = await page.textContent('#calcCinta');
  if (!/351\.500/.test(cinta)) throw new Error('La calculadora no calculó 1.850.000 × 19 % = 351.500');
  paso(`${nombre}: calculadora con cinta (1.850.000 × 19 % = 351.500)`);
  await foto('calculadora');
  await page.click('#calcCerrar');
  await page.click('#btnTema');
  await page.goto(archivo + '#inicio'); await page.waitForSelector('.cuenta-atras');
  await foto('inicio-tema-cambiado');
  paso(`${nombre}: tablero con cuenta regresiva y cambio de tema`);
  // Sin desbordamiento horizontal
  for (const r of ['inicio', 'mes-A', 'datos', 'ruta']) {
    await page.goto(archivo + '#' + r); await page.waitForTimeout(80);
    const ancho = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    if (ancho > 1) errores.push(`[${nombre}] desbordamiento horizontal de ${ancho}px en #${r}`);
  }
  paso(`${nombre}: sin desbordamiento horizontal`);
  await ctx.close();
}

(async () => {
  const browser = await playwright.chromium.launch();
  try {
    await recorrido(browser, 'celular', { viewport: { width: 400, height: 860 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
    await recorrido(browser, 'computador', { viewport: { width: 1280, height: 900 }, colorScheme: 'dark' });
  } catch (e) { errores.push('Falla del recorrido: ' + e.message); }
  await browser.close();
  console.log('\n' + '─'.repeat(60));
  if (errores.length) { console.log(`✘ ${errores.length} problemas:`); errores.forEach((e) => console.log('  – ' + e)); process.exit(1); }
  console.log(`✔ Interfaz sin errores (${pasos} pasos verificados).`);
})();
