const { test } = require('node:test');
const assert = require('node:assert/strict');
const m = require('./generated/app/core/finanzas/motor-financiero.js');
const p = require('./generated/app/core/finanzas/pagos.js');
const base = {
  monto: 1000,
  limite: 1500,
  fechaCompra: '2026-09-15',
  diaCorte: 20,
  diaPago: 26,
  cuotas: 3,
  tipoTasa: 'TEA',
  tasa: 0.24,
  tnm: 0.15,
  modalidad: 'cuotas',
};
const venta = (entrada) => ({
  id: 'CR-test',
  clienteId: 1,
  clienteNombre: 'Demo',
  producto: 'Torta',
  entrada,
  resultado: m.procesarVentaCredito(entrada),
  creadaEn: '',
  pagos: [],
});
const approx = (a, b, t = 0.0000005) => assert.ok(Math.abs(a - b) <= t, `${a} != ${b}`);
function verificarTCEA(v) {
  const r = v.resultado;
  const vp = r.cronograma.reduce(
    (s, f) =>
      s + f.cuota / (1 + r.tcea) ** (m.diasEntre(v.entrada.fechaCompra, f.vencimiento) / 360),
    0,
  );
  assert.ok(Math.abs(vp - v.entrada.monto) < 0.00001);
}
function invariantes(r) {
  assert.equal(r.aprobada, true);
  assert.equal(r.cronograma.at(-1).saldo, 0);
  for (const f of r.cronograma) {
    assert.equal(m.r2(f.interes + f.amortizacion), f.cuota);
    assert.equal(m.r2(f.saldoInicial - f.amortizacion), f.saldo);
    assert.ok(f.saldo >= 0 && f.cuota > 0);
  }
}
test('Informe 1: TEA, gracia, cronograma, TCEA y pago', () => {
  const v = venta(base),
    r = v.resultado;
  invariantes(r);
  assert.equal(r.fechaPago, '2026-09-26');
  assert.equal(r.diasGracia, 11);
  approx(r.tem, 0.018087583);
  assert.equal(r.saldoCapitalizado, 1006.59);
  assert.equal(r.cuotaFija, 347.74);
  approx(r.tcea, 0.2375551517);
  verificarTCEA(v);
  v.pagos.push(p.registrarPago(v, 1, '2026-10-26', 347.74, 'Efectivo', '2026-12-26'));
  assert.equal(p.saldoVenta(v), 677.06);
  assert.equal(m.r2(base.limite - p.saldoVenta(v)), 822.94);
});
test('Informe 2: TNA, pago único, mora, imputación y rechazo parcial', () => {
  const v = venta({
    ...base,
    monto: 850,
    fechaCompra: '2026-09-22',
    cuotas: 1,
    tipoTasa: 'TNA',
    tasa: 0.36,
    modalidad: 'unico',
  });
  const r = v.resultado;
  invariantes(r);
  assert.equal(r.fechaPago, '2026-10-26');
  assert.equal(r.diasGracia, 34);
  assert.equal(r.cuotaFija, 879.38);
  approx(r.tcea, 0.4330375139);
  verificarTCEA(v);
  assert.throws(() => p.registrarPago(v, 1, '2026-11-10', 884.87, 'Efectivo'));
  const pago = p.registrarPago(v, 1, '2026-11-10', 884.88, 'Efectivo');
  assert.deepEqual([pago.capital, pago.interes, pago.mora], [850, 29.38, 5.5]);
  v.pagos.push(pago);
  assert.equal(p.saldoVenta(v), 0);
});
test('Informe 3: seis cuotas, mora intermedia no altera cronograma', () => {
  const v = venta({
    ...base,
    monto: 1200,
    limite: 3000,
    fechaCompra: '2026-09-06',
    cuotas: 6,
    tasa: 0.3,
    tnm: 0.18,
  });
  const r = v.resultado;
  invariantes(r);
  assert.equal(r.saldoCapitalizado, 1217.62);
  assert.equal(r.cuotaFija, 218.92);
  approx(r.tcea, 0.2963899308);
  verificarTCEA(v);
  const snapshot = JSON.stringify(r.cronograma);
  v.pagos.push(p.registrarPago(v, 1, '2026-10-26', 218.92, 'Efectivo', '2027-03-26'));
  const q = p.cotizarPago(v, 2, '2026-12-06', '2027-03-26');
  assert.equal(q.dias, 10);
  assert.equal(q.mora, 1.09);
  assert.equal(q.total, 220.01);
  v.pagos.push(p.registrarPago(v, 2, '2026-12-06', q.total, 'Efectivo', '2027-03-26'));
  v.pagos.push(p.registrarPago(v, 3, '2026-12-26', 218.92, 'Efectivo', '2027-03-26'));
  assert.equal(p.saldoVenta(v), 628.77);
  assert.equal(m.r2(3000 - p.saldoVenta(v)), 2371.23);
  assert.equal(JSON.stringify(r.cronograma), snapshot);
});
test('Fechas de corte, año bisiesto y cambio de año', () => {
  assert.equal(m.fechaPagoDeCompra('2026-09-20', 20, 26), '2026-09-26');
  assert.equal(m.fechaPagoDeCompra('2025-12-21', 20, 26), '2026-01-26');
  assert.equal(m.sumarMeses('2024-01-31', 1), '2024-02-29');
  assert.equal(m.fechaValida('2026-02-30'), false);
});
test('Tasa cero y uso exacto de línea', () => {
  const r = m.procesarVentaCredito({ ...base, monto: 1500, tasa: 0 });
  invariantes(r);
  assert.equal(r.cuotaFija, 500);
  assert.equal(m.r2(r.tcea), 0);
});
test('Exceso de línea, incluida capitalización', () => {
  assert.equal(m.procesarVentaCredito({ ...base, pendientes: 900, monto: 700 }).aprobada, false);
  assert.equal(m.procesarVentaCredito({ ...base, monto: 1500 }).aprobada, false);
});
test('Entradas inválidas', () => {
  for (const x of [
    { monto: 0 },
    { monto: -1 },
    { cuotas: 0 },
    { cuotas: 2.5 },
    { cuotas: 61 },
    { fechaCompra: '2999-01-01' },
    { fechaCompra: '2026-02-30' },
    { diaPago: 19 },
    { diaCorte: 0 },
    { tasa: -0.1 },
    { tasa: NaN },
    { tnm: -0.1 },
  ])
    assert.equal(m.procesarVentaCredito({ ...base, ...x }).aprobada, false, JSON.stringify(x));
});
test('Pago duplicado, fuera de orden, fecha futura y excedente', () => {
  const v = venta(base);
  assert.throws(() => p.registrarPago(v, 2, '2026-10-26', 347.74, 'Efectivo'));
  assert.throws(() => p.registrarPago(v, 1, '2999-01-01', 347.74, 'Efectivo'));
  assert.throws(() => p.registrarPago(v, 1, '2026-10-26', 400, 'Efectivo'));
  v.pagos.push(p.registrarPago(v, 1, '2026-10-26', 347.74, 'Efectivo'));
  assert.throws(() => p.registrarPago(v, 1, '2026-10-26', 347.74, 'Efectivo'));
});
test('Liquidación completa y consistencia de centavos', () => {
  const v = venta(base);
  for (const f of v.resultado.cronograma)
    v.pagos.push(p.registrarPago(v, f.k, f.vencimiento, f.cuota, 'Efectivo', '2027-01-01'));
  assert.equal(p.saldoVenta(v), 0);
  assert.equal(m.r2(v.pagos.reduce((a, b) => a + b.capital, 0)), 1006.59);
});

test('Hora de corte y día de pago 31 tras febrero', () => {
  assert.equal(m.fechaPagoDeCompra('2026-09-20', 20, 26, '14:00', '14:00'), '2026-09-26');
  assert.equal(m.fechaPagoDeCompra('2026-09-20', 20, 26, '14:01', '14:00'), '2026-10-26');
  assert.equal(m.fechaPagoDeCompra('2024-02-29', 31, 31, '14:01', '14:00'), '2024-03-31');
  assert.deepEqual(
    m.generarCronograma(300, 0, 3, '2026-02-28', 31).map((f) => f.vencimiento),
    ['2026-03-31', '2026-04-30', '2026-05-31'],
  );
});
test('Mora efectiva anual y no capitalizable', () => {
  const v = venta({ ...base, tipoMora: 'TEMORA', tnm: 0.18 });
  const q = p.cotizarPago(v, 1, '2026-11-05', '2026-12-31');
  assert.equal(q.dias, 10);
  assert.equal(q.mora, m.r2(q.f.cuota * ((1 + 0.18) ** (10 / 360) - 1)));
  assert.equal(v.resultado.cronograma[0].cuota, 347.74);
});
