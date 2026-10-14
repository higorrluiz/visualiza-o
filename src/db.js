
import * as duckdb from '@duckdb/duckdb-wasm';

async function loadDb() {
  const bundles = duckdb.getJsDelivrBundles();
  const bundle = await duckdb.selectBundle(bundles);

  // O worker é criado a partir de um Blob para permitir
  // carregar o script hospedado no CDN.
  const workerUrl = URL.createObjectURL(
    new Blob(
      [`importScripts("${bundle.mainWorker}");`],
      { type: 'text/javascript' }
    )
  );

  const worker = new Worker(workerUrl);
  const logger = new duckdb.ConsoleLogger();
  const db = new duckdb.AsyncDuckDB(logger, worker);

  await db.instantiate(bundle.mainModule, bundle.pthreadWorker);

  URL.revokeObjectURL(workerUrl);

  return db;
}

export class Dados {
  async init() {
    this.db = await loadDb();
    this.conn = await this.db.connect();
  }

  async loadCsv(tabela, url) {
    const res = await fetch(url);

    if (!res.ok) {
      throw new Error(`Erro ao carregar ${url}: HTTP ${res.status}`);
    }

    await this.db.registerFileText(`${tabela}.csv`, await res.text());

    await this.conn.query(`
      CREATE TABLE ${tabela} AS
      SELECT * FROM read_csv_auto('${tabela}.csv', header = true);
    `);
  }

  async query(sql) {
    const result = await this.conn.query(sql);
    return result.toArray().map(row => row.toJSON());
  }
}
