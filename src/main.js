import { Dados } from './db.js';
import { AGREGADOS_SQL, nomePt } from './paises.js';
import { drawCandyA } from './candyA.js';
import { drawCandyB } from './candyB.js';
import { drawPopA } from './popA.js';
import { drawPopB } from './popB.js';
import { drawCoasterA } from './coasterA.js';
import { drawCoasterB } from './coasterB.js';

async function main() {
  // Abre o DuckDB
  const db = new Dados();
  await db.init();

  // ==================== Caso 1: doces ====================
  await db.loadCsv('doces', '/data/doces.csv');
  console.log('Linhas em doces:', await db.query('SELECT count(*) AS n FROM doces'));

  // Campeões por estado: contagem de 1º lugar por doce.
  // Só serve para definir a ordem da legenda e das cores do Design B.
  const campeoes = (await db.query(`
    SELECT "1st Place 2024" AS doce, count(*) AS total
    FROM doces
    GROUP BY doce
    ORDER BY total DESC
  `)).map(d => ({ doce: d.doce, total: Number(d.total) }));

  // Design A (mapa de calor): quantos estados deram a cada doce o 1º, 2º e 3º lugar.
  // UNION ALL empilha as três colunas de ranking numa só (doce, lugar).
  const candyA = (await db.query(`
    SELECT doce, lugar, count(*) AS n
    FROM (
      SELECT "1st Place 2024" AS doce, 1 AS lugar FROM doces
      UNION ALL
      SELECT "2nd Place 2024", 2 FROM doces
      UNION ALL
      SELECT "3rd Place 2024", 3 FROM doces
    )
    GROUP BY doce, lugar
  `)).map(d => ({ doce: d.doce, lugar: Number(d.lugar), n: Number(d.n) }));
  console.log('Candy A:', candyA);
  drawCandyA('#candyA', candyA);

  // Design B (tile grid map): doce campeão de cada estado
  const candyB = await db.query(`
    SELECT "State Name" AS estado, "1st Place 2024" AS doce
    FROM doces
  `);
  drawCandyB('#candyB', candyB, campeoes.map(d => d.doce));

  // ==================== Caso 2: montanhas-russas ====================
  await db.loadCsv('montanhas', '/data/montanhas_russas.csv');

  // Validação: o ranking tem 13 atrações
  console.log('Linhas em montanhas:', await db.query('SELECT count(*) AS n FROM montanhas'));

  // Design A (lollipop): todas as atrações ordenadas pela queda (desempate pelo nome)
  const coasterA = (await db.query(`
    SELECT "Name" AS nome, "Country" AS pais, "Drop (ft)" AS queda
    FROM montanhas
    ORDER BY queda DESC, nome
  `)).map(d => ({ nome: d.nome, pais: d.pais, queda: Number(d.queda) }));

  // Média das quedas (linha de referência do gráfico)
  const [{ media }] = await db.query(`SELECT avg("Drop (ft)") AS media FROM montanhas`);
  console.log('Coaster A:', coasterA, 'média:', Number(media));
  drawCoasterA('#coasterA', coasterA, Number(media));

  // Design B (dot plot): uma linha por atração, com a contagem e a maior queda do país.
  // As funções de janela (OVER PARTITION BY) calculam por país sem juntar as linhas.
  const coasterB = (await db.query(`
    SELECT "Name" AS nome,
           "Country" AS pais,
           "Drop (ft)" AS queda,
           count(*) OVER (PARTITION BY "Country") AS qtd,
           max("Drop (ft)") OVER (PARTITION BY "Country") AS maior
    FROM montanhas
    ORDER BY qtd DESC, maior DESC, queda DESC
  `)).map(d => ({
    nome: d.nome,
    pais: d.pais,
    queda: Number(d.queda),
    qtd: Number(d.qtd),
    maior: Number(d.maior),
  }));
  console.log('Coaster B:', coasterB);
  drawCoasterB('#coasterB', coasterB);

  // ==================== Caso 3: população mundial ====================
  await db.loadCsv('populacao', '/data/populacao.csv');

  // Validação: 265 linhas no total, 217 depois de tirar os agregados
  console.log('Validação população:', await db.query(`
    SELECT count(*) AS total,
           count(*) FILTER (WHERE "Country Code" NOT IN (${AGREGADOS_SQL})) AS paises
    FROM populacao
  `));

  // Design A: Top 15 países em 2025, com % da população mundial.
  // O denominador é a linha "WLD" (World) da própria tabela.
  // TRY_CAST garante número mesmo se o CSV vier com algum valor como texto.
  const popA = (await db.query(`
    SELECT "Country Code" AS codigo,
           "Country Name" AS pais,
           TRY_CAST("2025" AS DOUBLE) / 1e6 AS milhoes,
           TRY_CAST("2025" AS DOUBLE) * 100.0 /
             (SELECT TRY_CAST("2025" AS DOUBLE) FROM populacao WHERE "Country Code" = 'WLD') AS pct
    FROM populacao
    WHERE "Country Code" NOT IN (${AGREGADOS_SQL})
    ORDER BY milhoes DESC
    LIMIT 15
  `)).map(d => ({
    codigo: d.codigo,
    pais: nomePt(d.pais),
    milhoes: Number(d.milhoes),
    pct: Number(d.pct),
  }));
  console.log('Top 15 (popA):', popA);
  drawPopA('#popA', popA);

  // Design B: série 1960–2025 dos 8 países mais populosos de 2025.
  // UNPIVOT transforma as colunas de anos (1960, 1961, ...) em linhas (ano, pop).
  const popB = (await db.query(`
    WITH longo AS (
      UNPIVOT populacao
      ON COLUMNS(* EXCLUDE ("Country Name", "Country Code"))
      INTO NAME ano VALUE pop
    ),
    top8 AS (
      SELECT "Country Code"
      FROM populacao
      WHERE "Country Code" NOT IN (${AGREGADOS_SQL})
      ORDER BY TRY_CAST("2025" AS DOUBLE) DESC
      LIMIT 8
    )
    SELECT "Country Code" AS codigo,
           "Country Name" AS pais,
           CAST(ano AS INTEGER) AS ano,
           TRY_CAST(pop AS DOUBLE) / 1e6 AS milhoes
    FROM longo
    WHERE "Country Code" IN (SELECT "Country Code" FROM top8)
    ORDER BY codigo, ano
  `)).map(d => ({
    codigo: d.codigo,
    pais: nomePt(d.pais),
    ano: Number(d.ano),
    milhoes: d.milhoes == null ? null : Number(d.milhoes),
  }));
  console.log('Pontos em popB:', popB.length);   // esperado: 8 países x 66 anos = 528
  drawPopB('#popB', popB);
}

main();