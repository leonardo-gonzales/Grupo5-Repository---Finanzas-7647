# Revisión del motor financiero — actualización V5

Fuente: SI642 Trabajo Parcial - grupo5.pdf, páginas físicas 35–44, secciones 6.3 y 6.4; sección 4.8 (p. 17). Archivos: motor-financiero.ts y pagos.ts.

- TEA a TEM: (1+TEA)^(30/360)-1, correcta.
- TNA diaria a TEM: (1+TNA/360)^30-1, correcta.
- Interés compensatorio: P*((1+TEM)^(d/30)-1), correcto.
- Gracia total: S=P*(1+TEM)^(g/30), correcta.
- Francés: C=S*TEM/(1-(1+TEM)^(-n)), correcto; TEM cero: S/n. Interés, amortización, saldo y ajuste final correctos en los casos probados.
- TNM: cuota vencida*TNM*días/360, correcta, no capitalizable. V5 añade mora efectiva anual: cuota × [(1+TEMORA)^(días/360)−1]. No se capitaliza.
- Saldo insoluto y línea disponible: correctos para cronogramas y pagos probados. En pago único el saldo de capital excluye interés compensatorio aún no pagado; el importe exigible sí lo incluye.
- TCEA: V5 utiliza los importes efectivamente programados (redondeados a centavos), descontados por días reales/360, y excluye mora futura y cargos inexistentes. Para compra y pago el mismo día se muestra 0 (sin plazo de financiación). Las cifras difieren ligeramente del informe, que usa cuotas teóricas. No se añaden comisiones o seguros.
- Fechas: V5 aplica la hora de corte inclusiva y conserva el día pactado al avanzar desde meses cortos (día 31 → 28/29 en febrero → 31 en marzo). Se conserva la base comercial 360/30.

## Resultados ejecutados

| Caso | TEM (%) | Capital/deuda al vencimiento | Cuota | TCEA (%) | Saldo final |
|---|---:|---:|---:|---:|---:|
| 1 | 1.8087582 | 1006.59 | 347.74 | 23.7555152 | 0 |
| 2 | 3.0439088 | 879.38 | 879.38 | 43.3037514 | 0 |
| 3 | 2.2104451 | 1217.62 | 218.92 | 29.6389931 | 0 |

Caso 1: saldo tras cuota 1 = 677.06, línea 822.94; tras cuota 2 = 341.57 (informe 341.56), última cuota 347.75. Caso 2: mora 5.50, exigible 884.88. Caso 3: mora 1.09, exigible 220.01 (informe 220.02); saldo tras cuota 3 = 628.77, línea 2371.23; saldos 4 y 5 = 423.75 y 214.20 (informe 423.74 y 214.19), última cuota 218.93. El informe indica TEM 2.2104527% para TEA 30%, pero la fórmula da 2.210445059%. Los redondeos por fila aseguran el cierre contable.

La TCEA de V5 se valida adicionalmente sustituyendo la tasa obtenida en el valor presente de cada cuota; el valor presente coincide con el monto neto (tolerancia 0,00001). Los resultados anteriores del informe eran 23,7531%, 43,3072% y 29,6411%; no se ha modificado el informe original. La diferencia obedece al uso de flujos a centavos, no a un cambio de la conversión de tasas ni del método francés.
