import { describe, it, expect } from 'vitest';
import * as m from './motor-financiero';

describe('Prueba 1: compra antes del corte, gracia total, 3 cuotas', () => {
  const r = m.procesarVentaCredito({
    monto: 1000, limite: 1500, fechaCompra: '2026-09-15', diaCorte: 20, diaPago: 26,
    cuotas: 3, tipoTasa: 'TEA', tasa: 0.24,
  });
  it('fecha, gracia y TEM', () => {
    expect(r.fechaPago).toBe('2026-09-26');
    expect(r.diasGracia).toBe(11);
    expect(r.tem).toBeCloseTo(0.018087583, 8);
  });
  it('capitalización y cuota', () => {
    expect(r.saldoCapitalizado).toBe(1006.59);
    expect(r.interesGracia).toBe(6.59);
    expect(r.cuotaFija).toBe(347.74);
  });
  it('cronograma cierra en 0', () => {
    expect(r.cronograma!.map(f => f.saldo)).toEqual([677.06, 341.56, 0]);
    expect(r.cronograma![0].vencimiento).toBe('2026-10-26');
    expect(r.cronograma![0].interes).toBe(18.21);
  });
  it('TCEA ~ 23.75 %', () => {
    expect(r.tcea! * 100).toBeCloseTo(23.75, 1);
  });
  it('línea disponible tras cuota 1', () => {
    expect(m.r2(m.lineaDisponible(1500, 677.06))).toBe(822.94);
  });
});

describe('Prueba 2: compra después del corte, TNA, pago único y mora', () => {
  const tem = m.temDesdeTNA(0.36);
  const fechaPago = m.fechaPagoDeCompra('2026-09-22', 20, 26);
  const d = m.diasEntre('2026-09-22', fechaPago);
  it('traslada al mes siguiente', () => {
    expect(fechaPago).toBe('2026-10-26');
    expect(d).toBe(34);
  });
  it('TEM, interés compensatorio, mora y TCEA', () => {
    expect(tem).toBeCloseTo(0.030439088, 8);
    expect(m.r2(m.interesCompensatorio(850, tem, d))).toBe(29.38);
    expect(m.r2(m.interesMoratorio(879.38, 0.15, 15))).toBe(5.5);
    expect(m.tceaPagoUnico(tem) * 100).toBeCloseTo(43.3072, 3);
  });
  it('rechaza pago parcial', () => {
    expect(m.pagoValido(800, 884.88)).toBe(false);
    expect(m.pagoValido(884.88, 884.88)).toBe(true);
  });
});

describe('Prueba 3: seis cuotas, gracia 20 días', () => {
  const tem = m.temDesdeTEA(0.30);
  const S = m.capitalizarGracia(1200, tem, 20);
  const cron = m.generarCronograma(S, tem, 6, '2026-09-26');
  it('capital, cuota y saldos', () => {
    expect(m.r2(S)).toBe(1217.62);
    expect(m.r2(m.cuotaFrancesa(S, tem, 6))).toBe(218.92);
    expect(cron.map(f => f.saldo)).toEqual([1025.61, 829.36, 628.77, 423.74, 214.19, 0]);
  });
  it('saldo por fórmula = saldo del cronograma', () => {
    expect(m.r2(m.saldoInsoluto(m.cuotaFrancesa(S, tem, 6), tem, 6, 3))).toBe(628.77);
  });
  it('mora de la cuota 2', () => {
    expect(m.r2(m.interesMoratorio(218.92, 0.18, 10))).toBe(1.09);
  });
});

describe('Línea de crédito', () => {
  it('rechaza si supera lo disponible', () => {
    const r = m.procesarVentaCredito({
      monto: 700, limite: 1500, pendientes: 900, fechaCompra: '2026-09-15',
      diaCorte: 20, diaPago: 26, cuotas: 3, tipoTasa: 'TEA', tasa: 0.24,
    });
    expect(r.aprobada).toBe(false);
  });
});
