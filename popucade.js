import * as d3 from "d3";
import { JSDOM } from "jsdom";
import fs from "fs";
import duckdb from "duckdb";


console.log("1. Iniciando o script...");


async function main() {
    try {
        console.log("2. Preparando a estrutura HTML...");
        const dom = new JSDOM(`
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <title>Trabalho VD - População Mundial</title>
            <style>
                body { font-family: sans-serif; display: flex; flex-direction: column; align-items: center; background-color: #f4f4f9; padding: 20px; }
                .chart-container { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); margin-bottom: 40px; text-align: center;}
                .desc { max-width: 800px; text-align: left; font-size: 14px; color: #555; margin-bottom: 15px; }
            </style>
        </head>
        <body>
            <div id="chart1" class="chart-container">
                <h2>Design A - 15 Países Mais Populosos (2025)</h2>
                <div class="desc">
                    <strong>Vantagem Teórica:</strong> O alinhamento horizontal em uma escala comum é o canal visual mais preciso para comparar quantidades. Elimina o viés de área dos mapas e permite leitura exata de valores.
                </div>
            </div>
            <div id="chart2" class="chart-container">
                <h2>Design B - Evolução da População (1960 - 2025)</h2>
                <div class="desc">
                    <strong>Vantagem Teórica:</strong> Recupera a dimensão temporal. Evidencia o momento em que a Índia ultrapassa a China e o forte crescimento de países como Paquistão e Nigéria.
                </div>
            </div>
        </body>
        </html>
        `);


        const document = dom.window.document;
        const width = 900;
        const height = 500;
        const margin = { top: 40, right: 120, bottom: 50, left: 120 };


        console.log("3. Conectando ao DuckDB...");
        const db = new duckdb.Database(':memory:');
       
        const execQuery = (query) => {
            return new Promise((resolve, reject) => {
                db.all(query, (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            });
        };


        // ============================================================================
        // DESIGN A: Barras Horizontais
        // ============================================================================
       
        const queryA = `
            WITH world_pop AS (
                SELECT "2025" as total FROM read_csv_auto('./public/data/populacao.csv', header=true) WHERE "Country Name" = 'World'
            ),
            ranked_countries AS (
                SELECT "Country Name" as Country, "2025" as Population
                FROM read_csv_auto('./public/data/populacao.csv', header=true)
                WHERE "Country Name" NOT IN (
                    'World', 'IDA & IBRD total', 'Low & middle income', 'Middle income', 'IBRD only',
                    'Early-demographic dividend', 'Upper middle income', 'Lower middle income',
                    'East Asia & Pacific', 'Late-demographic dividend', 'East Asia & Pacific (excluding high income)',
                    'East Asia & Pacific (IDA & IBRD countries)', 'IDA total', 'South Asia', 'South Asia (IDA & IBRD)',
                    'High income', 'OECD members', 'Sub-Saharan Africa', 'Sub-Saharan Africa (IDA & IBRD countries)',
                    'Sub-Saharan Africa (excluding high income)', 'IDA only', 'Least developed countries: UN classification',
                    'Pre-demographic dividend', 'Post-demographic dividend', 'Heavily indebted poor countries (HIPC)',
                    'Europe & Central Asia', 'Middle East, North Africa, Afghanistan & Pakistan', 'Africa Eastern and Southern',
                    'Low income', 'Middle East, North Africa, Afghanistan & Pakistan (excluding high income)',
                    'Middle East, North Africa, Afghanistan & Pakistan (IDA & IBRD)', 'IDA blend', 'Latin America & Caribbean',
                    'Latin America & the Caribbean (IDA & IBRD countries)', 'Latin America & Caribbean (excluding high income)',
                    'Africa Western and Central', 'Arab World', 'Europe & Central Asia (IDA & IBRD countries)',
                    'European Union', 'North America', 'Middle East & North Africa', 'Middle East & North Africa (excluding high income)',
                    'Middle East & North Africa (IDA & IBRD countries)', 'Euro area', 'Fragile and conflict affected situations',
                    'Europe & Central Asia (excluding high income)', 'Central Europe and the Baltics', 'Other small states',
                    'Small states', 'Pacific island small states', 'Caribbean small states', 'Not classified'
                )
                ORDER BY Population DESC
                LIMIT 15
            )
            SELECT
                r.Country,
                r.Population,
                (r.Population / w.total) * 100 as Percentage
            FROM ranked_countries r, world_pop w
            ORDER BY r.Population ASC;
        `;


        console.log("4. Executando Consulta A...");
        let dataA = await execQuery(queryA);
       
        dataA = dataA.map(d => ({
            Country: d.Country,
            Population: Number(d.Population),
            Percentage: Number(d.Percentage)
        }));
       
        const container1 = d3.select(document.getElementById('chart1'));
        const svg1 = container1.append('svg').attr('width', width).attr('height', height).attr('xmlns', 'http://www.w3.org/2000/svg');


        const x1 = d3.scaleLinear()
            .domain([0, d3.max(dataA, d => d.Population)]).nice()
            .range([margin.left, width - margin.right]);
           
        const y1 = d3.scaleBand()
            .domain(dataA.map(d => d.Country))
            .range([height - margin.bottom, margin.top])
            .padding(0.2);


        svg1.append('g')
            .selectAll('rect')
            .data(dataA)
            .join('rect')
            .attr('x', margin.left)
            .attr('y', d => y1(d.Country))
            .attr('width', d => x1(d.Population) - margin.left)
            .attr('height', y1.bandwidth())
            .attr('fill', d => (d.Country === 'India' || d.Country === 'China') ? '#e83e8c' : '#cccccc');


        svg1.append("g")
            .selectAll("text")
            .data(dataA)
            .join("text")
            .attr("x", d => x1(d.Population) + 5)
            .attr("y", d => y1(d.Country) + y1.bandwidth() / 2)
            .attr("dy", "0.35em")
            .text(d => `${(d.Population / 1000000).toFixed(0)}M (${d.Percentage.toFixed(1)}%)`)
            .attr("font-size", "12px")
            .attr("fill", "#333");


        svg1.append('g')
            .attr('transform', `translate(0,${height - margin.bottom})`)
            .call(d3.axisBottom(x1).ticks(5).tickFormat(d => (d / 1000000) + 'M'));
       
        svg1.append('g')
            .attr('transform', `translate(${margin.left},0)`)
            .call(d3.axisLeft(y1));


        // ============================================================================
        // DESIGN B: Gráfico de Linhas
        // ============================================================================
        // Adicionado header=true
        const queryB = `
            WITH unpivoted AS (
                UNPIVOT read_csv_auto('./public/data/populacao.csv', header=true)
                ON COLUMNS(* EXCLUDE ("Country Name", "Country Code"))
                INTO
                    NAME Year
                    VALUE Population
            )
            SELECT "Country Name" as Country, CAST(Year AS INTEGER) as Year, Population
            FROM unpivoted
            WHERE "Country Name" IN (
                'India', 'China', 'United States', 'Indonesia', 'Pakistan',
                'Nigeria', 'Brazil', 'Bangladesh', 'Russian Federation', 'Ethiopia',
                'Mexico', 'Japan', 'Egypt, Arab Rep.', 'Philippines', 'Congo, Dem. Rep.'
            )
            ORDER BY Country, Year
        `;


        console.log("5. Executando Consulta B (UNPIVOT)...");
        let dataB = await execQuery(queryB);


        dataB = dataB.map(d => ({
            Country: d.Country,
            Year: Number(d.Year),
            Population: Number(d.Population)
        }));


        const container2 = d3.select(document.getElementById('chart2'));
        const svg2 = container2.append('svg').attr('width', width).attr('height', height).attr('xmlns', 'http://www.w3.org/2000/svg');


        const x2 = d3.scaleLinear()
            .domain(d3.extent(dataB, d => d.Year))
            .range([margin.left, width - margin.right]);
           
        const y2 = d3.scaleLinear()
            .domain([0, d3.max(dataB, d => d.Population)]).nice()
            .range([height - margin.bottom, margin.top]);


        const line = d3.line()
            .x(d => x2(d.Year))
            .y(d => y2(d.Population));


        const groupedData = d3.group(dataB, d => d.Country);


        svg2.append("g")
            .selectAll("path")
            .data(groupedData)
            .join("path")
            .attr("fill", "none")
            .attr("stroke", d => (d[0] === 'India' || d[0] === 'China') ? '#e83e8c' : '#cccccc')
            .attr("stroke-width", d => (d[0] === 'India' || d[0] === 'China') ? 3 : 1.5)
            .attr("d", d => line(d[1]));


        svg2.append("g")
            .selectAll("text")
            .data(groupedData)
            .join("text")
            .datum(d => {
                return {
                    country: d[0],
                    lastData: d[1][d[1].length - 1]
                };
            })
            .attr("x", d => x2(d.lastData.Year) + 5)
            .attr("y", d => y2(d.lastData.Population))
            .attr("dy", "0.35em")
            .text(d => d.country)
            .attr("font-size", "11px")
            .attr("fill", d => (d.country === 'India' || d.country === 'China') ? '#e83e8c' : '#777');


       
        svg2.append('g')
            .attr('transform', `translate(0,${height - margin.bottom})`)
            .call(d3.axisBottom(x2).tickFormat(d3.format("d")));
       
        svg2.append('g')
            .attr('transform', `translate(${margin.left},0)`)
            .call(d3.axisLeft(y2).tickFormat(d => (d / 1000000) + 'M'));


        console.log("6. Salvando o arquivo HTML no disco...");
        fs.writeFileSync('painel_populacao.html', dom.serialize(), 'utf8');
       
        console.log("SUCESSO! O arquivo 'painel_populacao.html' foi criado. Verifique a sua pasta.");


    } catch (error) {
        console.error("Um erro fatal ocorreu:", error);
    }
}


main();

