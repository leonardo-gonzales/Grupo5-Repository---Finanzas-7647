/** SQLite via sql.js (WebAssembly). OPFS stores a real SQLite database file. */
interface SqlDatabase {
  run(sql: string, params?: (string | number)[]): unknown;
  exec(sql: string): { columns: string[]; values: unknown[][] }[];
  export(): Uint8Array;
  close(): void;
}
interface SqlModule {
  Database: new (data?: Uint8Array) => SqlDatabase;
}
type SqlInitializer = (options: { locateFile: (file: string) => string }) => Promise<SqlModule>;
let engine: Promise<SqlModule> | undefined;
function sqlite(): Promise<SqlModule> {
  if (!engine) {
    engine = new Promise<SqlModule>((resolve, reject) => {
      const base = new URL('assets/sqlite/', document.baseURI);
      const script = document.createElement('script');
      script.src = new URL('sql-wasm.js', base).href;
      script.onload = () => {
        const init = (globalThis as unknown as { initSqlJs?: SqlInitializer }).initSqlJs;
        if (!init) {
          reject(Error('No se encontró el motor SQLite'));
          return;
        }
        init({ locateFile: (file) => new URL(file, base).href }).then(resolve, reject);
      };
      script.onerror = () =>
        reject(Error('No se pudo cargar SQLite. Ejecute npm ci y reinicie Angular.'));
      document.head.appendChild(script);
    });
    engine.catch(() => {
      engine = undefined;
    });
  }
  return engine;
}
export const SQLITE_FILE = 'tortishop-v6.sqlite';
export const SQLITE_SCHEMA =
  'CREATE TABLE IF NOT EXISTS registros (clave TEXT PRIMARY KEY NOT NULL, valor TEXT NOT NULL)';
export function leerRegistros(db: Pick<SqlDatabase, 'exec'>): Map<string, string> {
  const rows = db.exec('SELECT clave, valor FROM registros ORDER BY clave')[0]?.values ?? [];
  return new Map(rows.map(([key, value]) => [String(key), String(value)]));
}
export function guardarRegistros(db: Pick<SqlDatabase, 'run'>, map: Map<string, string>): void {
  db.run('BEGIN IMMEDIATE');
  try {
    db.run('DELETE FROM registros');
    for (const [key, value] of map)
      db.run('INSERT INTO registros (clave, valor) VALUES (?, ?)', [key, value]);
    db.run('COMMIT');
  } catch (error) {
    db.run('ROLLBACK');
    throw error;
  }
}
/** Read V5 only when creating the SQLite file. Never delete or write the legacy database. */
async function leerIndexedDBAnterior(): Promise<Map<string, string>> {
  if (typeof indexedDB === 'undefined') return new Map();
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('TortiShopV5', 1);
    let absent = false;
    request.onupgradeneeded = () => {
      absent = true;
      request.transaction?.abort();
    };
    request.onerror = () => (absent ? resolve(new Map()) : reject(request.error));
    request.onblocked = () =>
      reject(Error('Cierre las pestañas de TortiShop V5 para migrar la base anterior.'));
    request.onsuccess = () => {
      const old = request.result;
      if (!old.objectStoreNames.contains('registros')) {
        old.close();
        reject(Error('La base anterior no contiene registros'));
        return;
      }
      const map = new Map<string, string>();
      const tx = old.transaction('registros', 'readonly');
      const cursor = tx.objectStore('registros').openCursor();
      cursor.onsuccess = () => {
        const item = cursor.result;
        if (item) {
          map.set(String(item.key), String(item.value));
          item.continue();
        }
      };
      tx.oncomplete = () => {
        old.close();
        resolve(map);
      };
      tx.onabort = () => {
        old.close();
        reject(tx.error);
      };
      tx.onerror = () => {
        old.close();
        reject(tx.error);
      };
    };
  });
}
export async function conSQLite<T>(
  operacion: (map: Map<string, string>) => Promise<T>,
): Promise<T> {
  if (!navigator.storage?.getDirectory)
    throw Error(
      'SQLite requiere un navegador con OPFS (Chrome o Edge reciente) y localhost o HTTPS.',
    );
  const SQL = await sqlite();
  const root = await navigator.storage.getDirectory();
  let handle: FileSystemFileHandle | undefined;
  try {
    handle = await root.getFileHandle(SQLITE_FILE);
  } catch (error) {
    if (!(error instanceof DOMException && error.name === 'NotFoundError')) throw error;
  }
  const file = handle ? await handle.getFile() : undefined;
  const existing = !!file?.size;
  const db = new SQL.Database(existing ? new Uint8Array(await file!.arrayBuffer()) : undefined);
  try {
    db.run(SQLITE_SCHEMA);
    const map = existing ? leerRegistros(db) : await leerIndexedDBAnterior();
    if (!map.has('migration-v5')) {
      for (const key of ['tortishop.local.v2', 'tortishop-ventas-credito']) {
        const value = localStorage.getItem(key);
        if (value !== null && !map.has(key)) map.set(key, value);
      }
      map.set('migration-v5', '1');
    }
    map.set('migration-v6-sqlite', '1');
    const result = await operacion(map);
    guardarRegistros(db, map);
    const bytes = new Uint8Array(db.export());
    handle ??= await root.getFileHandle(SQLITE_FILE, { create: true });
    const writer = await handle.createWritable();
    try {
      await writer.write(bytes);
      await writer.close();
    } catch (error) {
      try {
        await writer.abort();
      } catch {}
      throw error;
    }
    return result;
  } finally {
    db.close();
  }
}
