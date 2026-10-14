import * as d3 from 'd3';
import { paisPt } from './paises.js';

// Dot plot: uma linha por país, um círculo por atração, posição = queda em pés.
// "dados": [{ nome, pais, queda, qtd, maior }], já ordenado por país (mais atrações primeiro)
export function drawCoasterB(seletor, dados) {
  const largura = 800, altura = 400;
  const margem = { top: 20, right: 30, bottom: 50, left: 120 };
  const larguraUtil = largura - margem.left - margem.right;
  const alturaUtil  = altura  - margem.top  - margem.bottom;
  const r = 7;                                  // raio dos círculos

  const svg = d3.select(seletor);
  svg.selectAll('*').remove();

  const g = svg.append('g')
    .attr('transform', `translate(${margem.left}, ${margem.top})`);

  // Países na ordem em que aparecem nos dados e a quantidade de cada um
  const paises = Array.from(new Set(dados.map(d => d.pais)));
  const qtd = new Map(dados.map(d => [d.pais, d.qtd]));

  // X: queda em pés. Num dot plot a posição basta, então o eixo não precisa começar em 0
  const x = d3.scaleLinear().domain([240, 430]).range([0, larguraUtil]);
  const y = d3.scaleBand().domain(paises).range([0, alturaUtil]).padding(0.1);

  // Faixas alternadas ajudam a ler cada linha
  g.selectAll('rect.faixa')
    .data(paises)
    .join('rect')
      .attr('class', 'faixa')
      .attr('x', 0)
      .attr('y', d => y(d))
      .attr('width', larguraUtil)
      .attr('height', y.bandwidth())
      .attr('fill', (d, i) => i % 2 === 0 ? '#f3f3f3' : '#ffffff');

  // Linhas verticais de grade
  g.selectAll('line.grade')
    .data(x.ticks(6))
    .join('line')
      .attr('class', 'grade')
      .attr('x1', d => x(d)).attr('x2', d => x(d))
      .attr('y1', 0).attr('y2', alturaUtil)
      .attr('stroke', '#ddd');

  // Eixos; o rótulo do país mostra quantas atrações ele tem
  g.append('g')
    .attr('transform', `translate(0, ${alturaUtil})`)
    .call(d3.axisBottom(x).ticks(6));
  g.append('g')
    .call(d3.axisLeft(y).tickSize(0).tickFormat(p => `${paisPt(p)} (${qtd.get(p)})`))
    .select('.domain').remove();

  g.append('text')
    .attr('x', larguraUtil / 2)
    .attr('y', alturaUtil + 38)
    .attr('text-anchor', 'middle')
    .attr('font-size', 13)
    .text('Queda (pés)');

  // Atrações com a mesma queda no mesmo país (ex.: 3 nos EUA com 300 ft)
  // são empilhadas na vertical para não ficarem uma em cima da outra
  const grupos = d3.group(dados, d => `${d.pais}|${d.queda}`);
  const pontos = Array.from(grupos.values()).flatMap(v =>
    v.map((d, i) => ({ ...d, desloc: (i - (v.length - 1) / 2) * (2 * r + 2) })));

  // Um círculo por atração (laranja = queda >= 400 ft, como no Design A)
  g.selectAll('circle')
    .data(pontos)
    .join('circle')
      .attr('cx', d => x(d.queda))
      .attr('cy', d => y(d.pais) + y.bandwidth() / 2 + d.desloc)
      .attr('r', r)
      .attr('fill', d => d.queda >= 400 ? '#d95f02' : '#7a9cc0')
      .attr('stroke', '#fff')
      .append('title')                              // tooltip ao passar o mouse
      .text(d => `${d.nome}: ${d.queda} ft`);

  // Rótulo com o nome da maior atração de cada país, à direita do ponto
  const maiores = dados.filter(d => d.queda === d.maior)
    .filter((d, i, v) => v.findIndex(o => o.pais === d.pais) === i);
  g.selectAll('text.nome')
    .data(maiores)
    .join('text')
      .attr('class', 'nome')
      .attr('x', d => x(d.queda) + r + 6)
      .attr('y', d => y(d.pais) + y.bandwidth() / 2 - (grupos.get(`${d.pais}|${d.queda}`).length - 1) * (r + 1))
      .attr('dy', '0.35em')
      .attr('font-size', 11)
      .text(d => d.nome);
}