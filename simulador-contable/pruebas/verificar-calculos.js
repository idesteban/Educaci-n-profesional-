/* Verificación contable del simulador.
   Uso (desde la raíz del repositorio):  node simulador-contable/pruebas/verificar-calculos.js
   Carga los bloques <script id="datos"> y <script id="motor"> de index.html y revisa:
   1) cálculos con valores conocidos (UVT 2026, IVA, retenciones, nómina, depreciación, conciliación),
   2) que las respuestas del banco de preguntas coincidan con los cálculos,
   3) cientos de ejercicios aleatorios: asientos cuadrados, cuentas válidas y solución = 100 %,
   4) el caso “Mes completo”: balance cuadrado, A = P + Pt, conciliación y auxiliares por tercero. */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
function bloque(id) {
  const m = html.match(new RegExp('<script id="' + id + '">([\\s\\S]*?)</script>'));
  if (!m) throw new Error('No encontré el bloque <script id="' + id + '">');
  return m[1];
}
const ctx = vm.createContext({ console });
vm.runInContext(bloque('datos'), ctx, { filename: 'datos.js' });
vm.runInContext(bloque('motor'), ctx, { filename: 'motor.js' });
const X = vm.runInContext(`({ P, Calc, GENERADORES, crearItem, refGen, refPregunta, calificarAsiento, calificarItem, calificarCampo,
  construirMes, versionMes, MES_VERSIONES, PREGUNTAS, TEMAS, ETAPAS, PUC_MAPA, cuentaPUC, leerNumero, pesos, miles,
  calificarEtapaMes, ETAPAS_MES, construirDiagnostico, construirSimulacro, SIMULACROS, cargarParametros, CONFIG, FICHAS, ENTREVISTA, CASOS_NUMERICOS })`, ctx);

let pasadas = 0, fallidas = 0;
const errores = [];
function ok(cond, msg) { if (cond) pasadas++; else { fallidas++; if (errores.length < 60) errores.push(msg); } }
function igual(a, b, msg) { ok(a === b, `${msg}: esperado ${b}, obtuve ${a}`); }
function seccion(t) { console.log('\n▸ ' + t); }

/* ---------- 1. Valores conocidos ---------- */
seccion('Parámetros 2026 y cálculos básicos');
const { P, Calc } = X;
igual(P.uvt, 52374, 'UVT 2026');
igual(Calc.uvt(27), 1414098, 'Base compras 27 UVT');
igual(Calc.uvt(4), 209496, 'Base servicios 4 UVT');
igual(P.smmlv, 1750905, 'SMMLV 2026');
igual(P.auxTransporte, 249095, 'Auxilio de transporte 2026');
igual(Calc.iva(1000000), 190000, 'IVA de 1.000.000');
igual(Calc.iva(1850000), 351500, 'IVA de 1.850.000');
igual(Calc.retefuente(1414098, 'compra', true).valor, 35352, 'Retefuente compra exactamente en la base (igual o superior)');
igual(Calc.retefuente(1414097, 'compra', true).valor, 0, 'Retefuente compra por debajo de 27 UVT');
igual(Calc.retefuente(2000000, 'compra', true).valor, 50000, 'Retefuente compra declarante 2,5 %');
igual(Calc.retefuente(2000000, 'compra', false).valor, 70000, 'Retefuente compra no declarante 3,5 %');
igual(Calc.retefuente(209496, 'servicio', true).valor, 8380, 'Retefuente servicio en la base');
igual(Calc.retefuente(209495, 'servicio', true).valor, 0, 'Retefuente servicio por debajo de 4 UVT');
igual(Calc.retefuente(800000, 'servicio', true).valor, 32000, 'Retefuente servicio declarante 4 %');
igual(Calc.retefuente(600000, 'servicio', false).valor, 36000, 'Retefuente servicio no declarante 6 %');
igual(Calc.retefuente(3000000, 'honorariosPJ').valor, 330000, 'Honorarios PJ 11 %');
igual(Calc.retefuente(100000, 'honorariosPJ').valor, 11000, 'Honorarios sin base mínima');
igual(Calc.retefuente(4000000, 'arrendamiento', true).valor, 140000, 'Arrendamiento 3,5 %');
igual(Calc.retefuente(1000000, 'arrendamiento', true).valor, 0, 'Arrendamiento por debajo de 27 UVT');
igual(Calc.reteiva(190000, 1000000, 'servicio', true).valor, 28500, 'ReteIVA 15 %');
igual(Calc.reteiva(190000, 1000000, 'servicio', false).valor, 0, 'ReteIVA sin gran contribuyente');
igual(Calc.reteiva(190000, 1000000, 'compra', true).valor, 0, 'ReteIVA compra por debajo de 27 UVT');
igual(Calc.reteica(2000000, 9.66, 'servicio').valor, 19320, 'ReteICA 9,66 por mil');
igual(Calc.reteica(100000, 9.66, 'servicio').valor, 0, 'ReteICA por debajo de la base');
{
  const base = 1000000, iva = Calc.iva(base), rf = Calc.retefuente(base, 'servicio', true).valor, ica = Calc.reteica(base, 9.66, 'servicio').valor;
  igual(base + iva - rf - ica, 1140340, 'Neto del ejemplo de repaso (servicio con retenciones)');
}
igual(Calc.gmf(5000000), 20000, 'GMF 4 × 1.000');
igual(Calc.depMensual(12000000, 0, 60), 200000, 'Depreciación 12 M a 5 años');
igual(Calc.depMensual(80000000, 8000000, 72), 1000000, 'Depreciación con residual');
igual(Calc.depMensual(24000000, 0, 120), 200000, 'Depreciación talanqueras');

seccion('Nómina con salario mínimo 2026');
{
  const n = Calc.nomina(P.smmlv);
  igual(n.aux, 249095, 'Auxilio de transporte');
  igual(n.salud, 70036, 'Salud 4 %');
  igual(n.pension, 70036, 'Pensión 4 %');
  igual(n.fsp, 0, 'Sin FSP');
  igual(n.devengado, 2000000, 'Devengado');
  igual(n.neto, 1859928, 'Neto a pagar');
  igual(n.cesantias, 166600, 'Cesantías 8,33 %');
  igual(n.intereses, 20000, 'Intereses 1 % de la base');
  igual(n.interesesAlt, 19992, 'Intereses como cesantías × 12 %');
  igual(n.prima, 166600, 'Prima 8,33 %');
  igual(n.vacaciones, 73013, 'Vacaciones 4,17 % solo salario');
  igual(n.prestaciones, 426213, 'Total prestaciones del repaso');
  igual(n.ap.pension, 210109, 'Pensión empleador 12 %');
  igual(n.ap.arl, 9140, 'ARL riesgo I');
  igual(n.ap.caja, 70036, 'Caja 4 %');
  igual(n.ap.salud + n.ap.icbf + n.ap.sena, 0, 'Exoneración art. 114-1');
  igual(n.aportes100, 289500, 'Aportes aproximados PILA a $ 100');
  const alto = Calc.nomina(7500000);
  igual(alto.aux, 0, 'Sin auxilio por encima de 2 SMMLV');
  igual(alto.fsp, 75000, 'FSP 1 % con 4 SMMLV o más');
  igual(Calc.nomina(3200000).aux, 249095, 'Auxilio para quien gana hasta 2 SMMLV');
  igual(Calc.nomina(4200000).fsp, 0, '4.200.000 no llega a 4 SMMLV');
  const noExo = Calc.nomina(P.smmlv, { exonerada: false });
  igual(noExo.ap.salud, 148827, 'Salud empleador 8,5 % sin exoneración');
  igual(noExo.ap.icbf + noExo.ap.sena, 52527 + 35018, 'ICBF 3 % y SENA 2 % sin exoneración');
  igual(noExo.aportes, 525657, 'Total aportes sin exoneración');
}

seccion('Conciliación del repaso');
{
  const ajExt = 18450000 - 2300000 + 1200000, ajLib = 17520000 - 120000 - 22800 - 67200 + 40000;
  igual(ajExt, 17350000, 'Extracto ajustado');
  igual(ajLib, ajExt, 'Libros ajustados = extracto ajustado');
  igual(Calc.iva(120000), 22800, 'IVA de la comisión del repaso');
  igual(2000000 - 40000 - Calc.iva(40000), 1952400, 'Abono esperado del datáfono');
}

seccion('Lectura de números y calculadora');
igual(X.leerNumero('1.414.098'), 1414098, 'Miles con punto');
igual(X.leerNumero('1414098'), 1414098, 'Sin separadores');
igual(X.leerNumero('12,5'), 12.5, 'Decimal con coma');
igual(X.leerNumero('$ 2.000.000'), 2000000, 'Con signo pesos');
igual(X.leerNumero('=2000000*19%'), 380000, 'Operación con porcentaje');
igual(X.leerNumero('2.000.000*0,19'), 380000, 'Operación con miles y coma');
igual(X.leerNumero('(1000+500)/2'), 750, 'Paréntesis');
igual(X.leerNumero('-5.000'), -5000, 'Negativo');
ok(Number.isNaN(X.leerNumero('abc')), 'Texto inválido da NaN');
ok(Number.isNaN(X.leerNumero('2+*3')), 'Operación inválida da NaN');

/* ---------- 2. Repasos y banco de preguntas ---------- */
seccion('Ejemplos de repaso de las etapas');
for (const e of X.ETAPAS) for (const rp of e.repaso) {
  ok(rp.titulo && rp.concepto && rp.enunciado && rp.pasos.length, `Repaso “${rp.titulo}” completo`);
  if (!rp.asiento.length) continue;
  const d = rp.asiento.reduce((s, l) => s + l[1], 0), h = rp.asiento.reduce((s, l) => s + l[2], 0);
  igual(d, h, `Repaso “${rp.titulo}” cuadra`);
  for (const l of rp.asiento) ok(!!X.cuentaPUC(l[0]), `Cuenta ${l[0]} del repaso existe en el PUC`);
}

seccion('Banco de preguntas');
const Q = X.PREGUNTAS;
ok(Q.length >= 120, `Hay al menos 120 preguntas (hay ${Q.length})`);
igual(new Set(Q.map((q) => q.id)).size, Q.length, 'Identificadores únicos');
for (const q of Q) {
  ok(Array.isArray(q.o) && q.o.length === 4, `${q.id} tiene 4 opciones`);
  ok(new Set(q.o).size === 4, `${q.id} tiene opciones distintas`);
  ok(Number.isInteger(q.r) && q.r >= 0 && q.r <= 3, `${q.id} tiene respuesta válida`);
  ok(typeof q.x === 'string' && q.x.length > 10, `${q.id} tiene explicación`);
  ok(X.TEMAS.some((t) => t.id === q.t), `${q.id} tiene un tema válido`);
}
for (const t of X.TEMAS) { const n = Q.filter((q) => q.t === t.id).length; ok(n >= 8, `Tema ${t.id} tiene al menos 8 preguntas (tiene ${n})`); }
for (const e of X.ETAPAS) { const n = Q.filter((q) => q.e === e.id).length; ok(n >= 2, `Etapa ${e.id} tiene preguntas para el diagnóstico (tiene ${n})`); }
for (const e of X.ETAPAS) {
  ok(e.repaso.length >= 2, `Etapa ${e.id} tiene al menos 2 repasos`);
  for (const g of e.guiado.concat(e.independiente, e.mini.gens)) ok(!!X.GENERADORES[g], `Etapa ${e.id}: el generador ${g} existe`);
}
const correcta = (id) => { const q = Q.find((x) => x.id === id); return q.o[q.r]; };
const contiene = (id, valor) => ok(correcta(id).includes(X.pesos(valor)), `${id}: la respuesta correcta contiene ${X.pesos(valor)} (dice “${correcta(id)}”)`);
contiene('IM01', Calc.uvt(27)); contiene('IM02', Calc.uvt(4)); contiene('IM04', Calc.retefuente(800000, 'servicio', true).valor);
contiene('IM06', Calc.reteiva(190000, 1000000, 'servicio', true).valor); contiene('IM09', Calc.reteica(2000000, 9.66, 'servicio').valor);
contiene('IM10', Calc.gmf(5000000)); contiene('IM11', Calc.retefuente(3000000, 'honorariosPJ').valor); contiene('IM12', Calc.retefuente(4000000, 'arrendamiento', true).valor);
contiene('IM15', Calc.retefuente(2000000, 'compra', false).valor); contiene('IM13', 9500000 - 6200000); contiene('CA03', 120000000 - 70000000);
contiene('NO01', Calc.nomina(P.smmlv).deducciones); contiene('NO02', 2 * P.smmlv); contiene('NO05', Math.round(2500000 * P.cesantias));
contiene('AJ02', Calc.depMensual(12000000, 0, 60)); contiene('AJ10', Calc.depMensual(80000000, 8000000, 72)); contiene('AJ11', Math.round(2000000 * P.cesantias));
contiene('AJ08', 80000); contiene('CO07', 10000000 - 1500000 + 700000); contiene('TE08', 8000000 + 12000000 - 17500000); contiene('AN13', 5000000 + 12000000 - 9500000);
contiene('AN15', 8000000 + 5000000 - 6500000); contiene('AN10', 30000000 - 24500000);
ok(correcta('IM03').includes('$ 0') && 1200000 < Calc.uvt(27), 'IM03: 1.200.000 está por debajo de 27 UVT');
igual(Math.round((new Date(2026, 8, 30) - new Date(2026, 6, 10)) / 86400000), 82, 'TE03: del 10 de julio al 30 de septiembre hay 82 días (61–90)');
igual(Math.round(40000 * 1.19) + 0, 47600, 'CO06: comisión 2 % + IVA sobre 2.000.000');

seccion('Fichas, entrevista y casos numéricos');
for (const f of X.FICHAS) ok(f.cat && f.f && f.r, `Ficha “${f.f}” completa`);
igual(X.ENTREVISTA.length, 15, 'Hay 15 preguntas de entrevista');
for (const e of X.ENTREVISTA) ok(e.q && e.S && e.T && e.A && e.R && e.frases.length && e.evitar, `Entrevista ${e.id} con guía STAR completa`);
igual(new Set(X.ENTREVISTA.map((e) => e.id)).size, 15, 'Entrevista: identificadores únicos');
igual(X.CASOS_NUMERICOS.length, 9, 'Hay 9 casos prácticos numéricos');
for (const c of X.CASOS_NUMERICOS) for (const g of c.gens) ok(!!X.GENERADORES[g], `Caso ${c.id}: el generador ${g} existe`);

/* ---------- 3. Ejercicios generados ---------- */
function respuestaPerfecta(item) {
  const campos = {};
  for (const c of item.campos) campos[c.id] = c.tipo === 'opcion' ? String(c.ok) : X.miles(c.valor) === '0' ? '0' : (c.valor < 0 ? '-' : '') + X.miles(c.valor);
  const asientos = item.asientos.map((a) => a.lineas.map((l) => ({ cod: l.c, d: l.d ? String(l.d) : '', h: l.h ? String(l.h) : '' })));
  return { campos, asientos };
}
function revisarAsientos(asientos, etiqueta) {
  for (const a of asientos) {
    const d = a.lineas.reduce((s, l) => s + (l.d || 0), 0), h = a.lineas.reduce((s, l) => s + (l.h || 0), 0);
    ok(d === h, `${etiqueta} – “${a.titulo}” cuadra (débitos ${d} vs. créditos ${h})`);
    ok(a.lineas.length >= 2, `${etiqueta} – “${a.titulo}” tiene al menos 2 líneas`);
    for (const l of a.lineas) {
      ok(!!X.cuentaPUC(l.c), `${etiqueta} – la cuenta ${l.c} existe en el PUC`);
      ok(Number.isInteger(l.d || 0) && Number.isInteger(l.h || 0) && (l.d || 0) >= 0 && (l.h || 0) >= 0, `${etiqueta} – valores enteros y positivos en ${l.c}`);
      for (const e of (l.eq || [])) ok(e.length <= 2 || !!X.cuentaPUC(e), `${etiqueta} – la cuenta equivalente ${e} existe`);
    }
  }
}
seccion('Ejercicios aleatorios (todos los generadores, niveles 1 a 3)');
const RONDAS = 300;
let totalEj = 0;
for (const g of Object.keys(X.GENERADORES)) {
  for (let nivel = 1; nivel <= 3; nivel++) {
    for (let s = 1; s <= RONDAS; s++) {
      const item = X.crearItem(X.refGen(g, nivel, s * 7919 + nivel));
      const et = `${g} n${nivel} s${s}`;
      totalEj++;
      ok(!!item, `${et} se crea`);
      if (!item) continue;
      const texto = item.enunciado + item.solucion + JSON.stringify(item.campos);
      ok(!/NaN|undefined|Infinity/.test(texto), `${et} sin NaN/undefined en el texto`);
      for (const c of item.campos) {
        if (c.tipo === 'opcion') ok(Number.isInteger(c.ok) && c.ok >= 0 && c.ok < c.ops.length, `${et} campo ${c.id} con opción válida`);
        else ok(Number.isFinite(c.valor), `${et} campo ${c.id} con valor numérico`);
      }
      revisarAsientos(item.asientos, et);
      const res = X.calificarItem(item, respuestaPerfecta(item));
      ok(Math.abs(res.puntaje - 1) < 1e-9, `${et}: la solución obtiene 100 % (obtuvo ${(res.puntaje * 100).toFixed(1)} %)`);
      // Recalcular por fuera la causación de compras y servicios
      if ((g === 'compraBienes' || g === 'servicio') && item.asientos[0]) {
        const lin = item.asientos[0].lineas, base = lin[0].d, v = (id) => (item.campos.find((c) => c.id === id) || { valor: 0 }).valor;
        igual(v('iva'), Math.round(base * P.iva), `${et} IVA`);
        const tipo = g === 'compraBienes' ? 'compra' : 'servicio', min = Calc.uvt(tipo === 'compra' ? 27 : 4);
        const rf = v('rf');
        ok(base >= min ? rf > 0 : rf === 0, `${et} retefuente respeta la base mínima (base ${base}, retención ${rf})`);
        if (rf > 0) ok([P.rfComprasDecl, P.rfComprasNoDecl, P.rfServiciosDecl, P.rfServiciosNoDecl].some((t) => Math.round(base * t) === rf), `${et} tarifa de retefuente válida`);
        igual(v('neto'), base + v('iva') - rf - v('riva') - v('rica'), `${et} neto = base + IVA − retenciones`);
      }
    }
  }
}
for (let s = 1; s <= 300; s++) {
  const f = X.crearItem(X.refGen('flujoCaja', 1 + (s % 3), s * 131));
  const v = (id) => f.campos.find((c) => c.id === id).valor;
  ok(v('final') >= 1000000, `Flujo de caja ${s}: el saldo final respeta el mínimo`);
  ok(v('disp') - v('prior') > v('final'), `Flujo de caja ${s}: se pagan proveedores`);
  const c = X.crearItem(X.refGen('edadesCartera', 1 + (s % 3), s * 137));
  const w = (id) => c.campos.find((x) => x.id === id).valor;
  igual(w('e1') + w('e2') + w('e3') + w('e4'), w('tot'), `Edades de cartera ${s}: los rangos suman el total`);
}
console.log(`  ${totalEj} ejercicios generados y calificados`);

seccion('Calificador de asientos');
{
  const esperado = [{ c: '5145', d: 1000000, h: 0, eq: ['5135'] }, { c: '2408', d: 190000, h: 0 }, { c: '2365', d: 0, h: 40000 }, { c: '2335', d: 0, h: 1150000, eq: ['2205'] }];
  let r = X.calificarAsiento(esperado, [{ cod: '5145', d: '1.000.000' }, { cod: '240810', d: '190000' }, { cod: '2365', h: '40.000' }, { cod: '2205', h: '1150000' }]);
  igual(r.puntaje, 1, 'Acepta subcuenta de 6 dígitos y cuenta equivalente');
  r = X.calificarAsiento(esperado, [{ cod: '5145', d: '1000000' }, { cod: '2408', h: '190000' }, { cod: '2365', h: '40000' }, { cod: '2335', h: '1150000' }]);
  igual(r.lineas[1].estado, 'lado', 'Detecta cuenta correcta en el lado equivocado');
  ok(r.puntaje < 1 && !r.cuadra, 'Penaliza el lado equivocado y detecta descuadre');
  r = X.calificarAsiento(esperado, [{ cod: '5145', d: '600000' }, { cod: '5145', d: '400000' }, { cod: '2408', d: '190000' }, { cod: '2365', h: '40000' }, { cod: '2335', h: '1150001' }]);
  igual(r.puntaje, 1, 'Suma líneas partidas y tolera ± $2');
  r = X.calificarAsiento(esperado, [{ cod: '5145', d: '1000000' }, { cod: '2335', h: '1000000' }]);
  igual(r.faltantes.length, 2, 'Informa las cuentas que faltan');
  r = X.calificarAsiento([{ c: '5105', d: 20000, h: 0, alt: [19992] }, { c: '2610', d: 0, h: 20000, alt: [19992], eq: ['2515'] }], [{ cod: '5105', d: '19992' }, { cod: '2515', h: '19992' }]);
  igual(r.puntaje, 1, 'Acepta el método alternativo de intereses sobre cesantías');
  r = X.calificarAsiento(esperado, [{ cod: '1105', d: '1000000' }, { cod: '2408', d: '190000' }, { cod: '2365', h: '40000' }, { cod: '2335', h: '1150000' }]);
  igual(r.lineas[0].estado, 'mal', 'Marca en rojo una cuenta que no corresponde');
}

/* ---------- 4. Caso Mes completo ---------- */
seccion('Caso integrado “Mes completo” (versiones A, B, C y 300 aleatorias)');
function revisarMes(v, et) {
  const m = X.construirMes(v);
  ok(m.txs.length >= 15 && m.txs.length <= 25, `${et}: entre 15 y 25 transacciones (tiene ${m.txs.length})`);
  revisarAsientos(m.txs.map((t) => ({ titulo: 'T' + t.n + ' ' + t.corto, lineas: t.lineas })), et);
  revisarAsientos(m.ajustes.map((t) => ({ titulo: 'Ajuste ' + t.n, lineas: t.lineas })), et);
  revisarAsientos(m.conc.asientos, et);
  const sI = m.iniciales.reduce((s, x) => s + x.s, 0);
  igual(sI, 0, `${et}: saldos iniciales cuadran`);
  igual(m.bp.reduce((s, x) => s + x.s, 0), 0, `${et}: balance de prueba cuadra`);
  igual(m.bpa.reduce((s, x) => s + x.s, 0), 0, `${et}: balance ajustado cuadra`);
  const e = Object.fromEntries(m.eeff.campos.map((c) => [c.id, c.valor]));
  igual(e.act, e.pas + e.pat, `${et}: Activo = Pasivo + Patrimonio`);
  igual(e.actCte + e.actNoCte, e.act, `${et}: activo corriente + no corriente = total`);
  igual(e.ingOp - e.gasOp - e.gasNoOp, e.util, `${et}: utilidad = ingresos − gastos`);
  const k = m.control;
  igual(k.saldoLibros - k.nd + k.nc, k.ajustado, `${et}: libros ajustados`);
  igual(k.saldoExtracto - k.pendientes + k.transito, k.ajustado, `${et}: extracto ajustado`);
  const b = Object.fromEntries(m.bpa.map((x) => [x.c, x.s]));
  igual(b['1110'], k.ajustado, `${et}: bancos en el balance ajustado = saldo conciliado`);
  ok((b['1105'] || 0) >= 0, `${et}: caja sin saldo crédito`);
  const cxc = m.cxpc.campos.filter((c) => c.id.startsWith('cxc')).reduce((s, c) => s + c.valor, 0);
  const cxp = m.cxpc.campos.filter((c) => c.id.startsWith('cxp')).reduce((s, c) => s + c.valor, 0);
  const ed = m.cxpc.campos.filter((c) => /^e\d$/.test(c.id)).reduce((s, c) => s + c.valor, 0);
  igual(cxc, b['1305'] || 0, `${et}: auxiliar de clientes = mayor 1305`);
  igual(ed, b['1305'] || 0, `${et}: edades de cartera = mayor 1305`);
  igual(cxp, -((b['2205'] || 0) + (b['2335'] || 0)), `${et}: auxiliar de proveedores = mayor 2205 + 2335`);
  for (const ct of m.cuentasT) {
    const bpc = (m.bp.find((x) => x.c === ct.c) || { s: 0 }).s;
    igual(ct.saldo, bpc, `${et}: cuenta T ${ct.c} = balance de prueba`);
  }
  const texto = JSON.stringify(m.txs) + JSON.stringify(m.ajustes) + m.conc.solucion + m.perfil;
  ok(!/NaN|undefined|Infinity/.test(texto), `${et}: sin NaN/undefined en textos`);
  // Calificar con respuestas perfectas
  const perf = {
    diario: Object.fromEntries(m.txs.map((t) => [t.n, t.lineas.map((l) => ({ cod: l.c, d: String(l.d || ''), h: String(l.h || '') }))])),
    ajustes: Object.fromEntries(m.ajustes.map((t) => [t.n, t.lineas.map((l) => ({ cod: l.c, d: String(l.d || ''), h: String(l.h || '') }))])),
    t: Object.fromEntries(m.cuentasT.map((ct) => [ct.c, { pos: Object.fromEntries(ct.movs.map((x) => [x.id, x.lado])), deb: String(ct.deb), cre: String(ct.cre), saldo: String(Math.abs(ct.saldo)) }])),
    bp: Object.fromEntries(m.bp.map((f) => [f.c, f.s > 0 ? { d: String(f.s) } : f.s < 0 ? { h: String(-f.s) } : {}])),
    bpa: Object.fromEntries(m.bpa.map((f) => [f.c, f.s > 0 ? { d: String(f.s) } : f.s < 0 ? { h: String(-f.s) } : {}])),
    conc: { campos: Object.fromEntries(m.conc.campos.map((c) => [c.id, String(c.valor)])), asientos: m.conc.asientos.map((a) => a.lineas.map((l) => ({ cod: l.c, d: String(l.d || ''), h: String(l.h || '') }))) },
    eeff: Object.fromEntries(m.eeff.campos.map((c) => [c.id, String(c.valor)])),
    cxpc: Object.fromEntries(m.cxpc.campos.map((c) => [c.id, String(c.valor)]))
  };
  for (const et2 of X.ETAPAS_MES) {
    const p = X.calificarEtapaMes(m, et2.id, perf[et2.id]).puntaje;
    ok(Math.abs(p - 1) < 1e-9, `${et}: etapa ${et2.id} con respuestas correctas = 100 % (obtuvo ${(p * 100).toFixed(1)} %)`);
  }
  return m;
}
for (const v of X.MES_VERSIONES) {
  const m = revisarMes(v, 'Versión ' + v.id);
  console.log(`  Versión ${v.id} (${m.periodo}): ${m.txs.length} transacciones, utilidad ${X.pesos(m.utilidad)}, bancos conciliados ${X.pesos(m.control.ajustado)}`);
}
for (let s = 1; s <= 300; s++) revisarMes(X.versionMes('R' + (s * 104729)), 'Aleatorio ' + s);

/* ---------- 5. Diagnóstico y simulacros ---------- */
seccion('Diagnóstico y simulacros');
for (let s = 1; s <= 50; s++) {
  const d = X.construirDiagnostico(s * 31);
  ok(d.length >= 18 && d.length <= 25, `Diagnóstico ${s} con 18–25 ítems (tiene ${d.length})`);
  for (const e of X.ETAPAS) ok(d.some((ref) => { const it = X.crearItem(ref); return it && it.etapa === e.id; }), `Diagnóstico ${s} evalúa la etapa ${e.id}`);
  const mts = X.construirSimulacro('mts', s * 17), rap = X.construirSimulacro('rapido', s * 13);
  ok(mts.every((ref) => !!X.crearItem(ref)), `Simulacro MTS ${s}: todos los ítems existen`);
  igual(mts.filter((x) => x.k === 'gen').length, X.SIMULACROS.mts.ejercicios.length, `Simulacro MTS ${s}: número de ejercicios`);
  igual(rap.length, 20, `Simulacro rápido ${s}: 20 preguntas`);
  igual(new Set(rap.map((x) => x.id)).size, 20, `Simulacro rápido ${s}: sin preguntas repetidas`);
}

/* ---------- Resultado ---------- */
console.log('\n' + '─'.repeat(60));
if (fallidas) {
  console.log(`✘ ${fallidas} verificaciones fallidas de ${pasadas + fallidas}. Primeras fallas:`);
  for (const e of errores) console.log('  – ' + e);
  process.exit(1);
} else {
  console.log(`✔ ${pasadas} verificaciones correctas. Cálculos y asientos en orden.`);
}
