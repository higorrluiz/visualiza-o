import * as duckdb from '@duckdb/duckdb-wasm';
import duckdb_wasm from '@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm?url';
import mvp_worker from '@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js?url';
import duckdb_wasm_eh from '@duckdb/duckdb-wasm/dist/duckdb-eh.wasm?url';
import eh_worker from '@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js?url';

// Duas versões do DuckDB; o navegador escolhe a melhor
const MANUAL_BUNDLES = {
  mvp: { mainModule: duckdb_wasm,    mainWorker: mvp_worker },
  eh:  { mainModule: duckdb_wasm_eh, mainWorker: eh_worker },
};

// Cria e inicializa o DuckDB-wasm (mesmo código do exemplo do professor)
async function loadDb() {
  const bundle = await duckdb.selectBundle(MANUAL_BUNDLES);
  const worker = new Worker(bundle.mainWorker);
  const logger = new duckdb.ConsoleLogger();
  const db = new duckdb.AsyncDuckDB(logger, worker);
  await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
  return db;
}

export class Dados {
  // Abre o banco e uma conexão
  async init() {
    this.db = await loadDb();
    this.conn = await this.db.connect();
  }

 // Lê um CSV da pasta public/ e cria uma tabela com o nome indicado.
  // header = true: força o uso da primeira linha como nomes das colunas
  // (necessário quando os nomes são números, como os anos 1960, 1961, ...)
  async loadCsv(tabela, url) {
    const res = await fetch(url);
    await this.db.registerFileText(`${tabela}.csv`, await res.text());
    await this.conn.query(`
      CREATE TABLE ${tabela} AS
      SELECT * FROM read_csv_auto('${tabela}.csv', header = true);
    `);
  }

  // Roda um SQL e devolve uma lista de objetos simples
  async query(sql) {
    const result = await this.conn.query(sql);
    return result.toArray().map(row => row.toJSON());
  }
}
