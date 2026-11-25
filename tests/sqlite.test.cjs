const { test } = require('node:test');
const assert = require('node:assert/strict');
const { mkdtempSync, readFileSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const { DatabaseSync } = require('node:sqlite');
const {
  SQLITE_SCHEMA,
  leerRegistros,
  guardarRegistros,
} = require('./generated/app/core/services/sqlite-store.js');
const adapt = (db) => ({
  run: (sql, params) => (params ? db.prepare(sql).run(...params) : db.exec(sql)),
  exec: (sql) => [
    {
      values: db
        .prepare(sql)
        .all()
        .map((row) => [row.clave, row.valor]),
    },
  ],
});
test('SQLite nativo: persistencia física, reapertura, eliminación y rollback del adaptador SQL', () => {
  const dir = mkdtempSync(join(tmpdir(), 'tortishop-sqlite-'));
  const file = join(dir, 'tortishop.sqlite');
  let db;
  try {
    db = new DatabaseSync(file);
    db.exec(SQLITE_SCHEMA);
    const records = new Map([
      ['tortishop.local.v2', '{"credits":[]}'],
      ['migration-v6-sqlite', '1'],
    ]);
    guardarRegistros(adapt(db), records);
    db.close();
    db = undefined;
    assert.equal(readFileSync(file).subarray(0, 16).toString(), 'SQLite format 3\0');
    db = new DatabaseSync(file);
    assert.deepEqual(leerRegistros(adapt(db)), records);
    const normal = adapt(db);
    assert.throws(
      () =>
        guardarRegistros(
          {
            run(sql, params) {
              if (sql.startsWith('INSERT')) throw Error('Fallo simulado');
              return normal.run(sql, params);
            },
          },
          new Map([['nuevo', 'valor']]),
        ),
      /Fallo simulado/,
    );
    assert.deepEqual(leerRegistros(normal), records);
    records.delete('migration-v6-sqlite');
    guardarRegistros(normal, records);
    assert.deepEqual(leerRegistros(normal), records);
  } finally {
    db?.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
let initSqlJs;
try {
  initSqlJs = require('sql.js');
} catch (error) {
  if (error.code !== 'MODULE_NOT_FOUND') throw error;
}
test(
  'SQLite WASM (sql.js): exportar y reabrir la base binaria',
  { skip: !initSqlJs && 'Instalar dependencia sql.js con npm ci' },
  async () => {
    const SQL = await initSqlJs();
    const db = new SQL.Database();
    db.run(SQLITE_SCHEMA);
    const records = new Map([['negocio', '{"clientes":[1],"creditos":[]}']]);
    guardarRegistros(db, records);
    const bytes = db.export();
    db.close();
    assert.equal(Buffer.from(bytes.subarray(0, 16)).toString(), 'SQLite format 3\0');
    const reopened = new SQL.Database(bytes);
    try {
      assert.deepEqual(leerRegistros(reopened), records);
    } finally {
      reopened.close();
    }
  },
);
