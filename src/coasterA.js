import * as d3 from 'd3';
import { paisPt } from './paises';

// Desenha o ranking de quedas em formato lollipop (linha + ponto).
// "dados": [{ nome, pais, queda }] ordenado da maior para a menor queda
// "media": queda média do ranking (calculada no DuckDB)
export function drawCoasterA(seletor, dados, media) {
  const largura = 800, altura = 400;
  const margem = { top: 15, right: 140, bottom: 40, left: 215 };  // left grande p/ nomes longos
  const larguraUtil = largura - margem.left - margem.right;
  const alturaUtil  = altura  - margem.top  - margem.bottom;

  const svg = d3.select(seletor);
  svg.selectAll('*').remove();

  const g = svg.append('g')
    .attr('transform', `translate(${margem.left}, ${margem.top})`);

  // X: queda em pés (começa em 0 para o comprimento da linha ser fiel ao valor)
  const x = d3.scaleLinear()
    .domain([0, d3.max(dados, d => d.queda)])
    .range([0, larguraUtil]);

  // Y: nome da atração (categórico), na ordem dos dados
  const y = d3.scaleBand()
    .domain(dados.map(d => d.nome))
    .range([0, alturaUtil])
    .padding(0.3);

  // Eixos
  g.append('g')
    .attr('transform', `translate(0, ${alturaUtil})`)
    .call(d3.axisBottom(x).ticks(6));
  g.append('g').call(d3.axisLeft(y).tickSize(0));

  g.append('text')
    .attr('x', larguraUtil / 2)
    .attr('y', alturaUtil + 35)
    .attr('text-anchor', 'middle')
    .attr('font-size', 13)
    .text('Queda (pés)');

  // Destaque: queda >= 400 ft; as demais em cinza neutro
  const cor = d => d.queda >= 400 ? '#d95f02' : '#9a9a9a';

  // Linha de referência: a média do ranking
  g.append('line')
    .attr('x1', x(media)).attr('x2', x(media))
    .attr('y1', 0).attr('y2', alturaUtil)
    .attr('stroke', '#555')
    .attr('stroke-dasharray', '4 3');

  g.append('text')
    .attr('x', x(media) + 4)
    .attr('y', alturaUtil - 4)
    .attr('font-size', 12)
    .attr('fill', '#555')
    .text(`Média: ${Math.round(media)} ft`);

  // A "haste" do lollipop: linha de 0 até o valor
  g.selectAll('line.haste')
    .data(dados)
    .join('line')
      .attr('class', 'haste')
      .attr('x1', 0)
      .attr('x2', d => x(d.queda))
      .attr('y1', d => y(d.nome) + y.bandwidth() / 2)
      .attr('y2', d => y(d.nome) + y.bandwidth() / 2)
      .attr('stroke', cor)
      .attr('stroke-width', 2);

  // O "pirulito": círculo na ponta
  g.selectAll('circle')
    .data(dados)
    .join('circle')
      .attr('cx', d => x(d.queda))
      .attr('cy', d => y(d.nome) + y.bandwidth() / 2)
      .attr('r', 6)
      .attr('fill', cor);

  // Rótulo: valor e país
  g.selectAll('text.valor')
    .data(dados)
    .join('text')
      .attr('class', 'valor')
      .attr('x', d => x(d.queda) + 12)
      .attr('y', d => y(d.nome) + y.bandwidth() / 2)
      .attr('dy', '0.35em')
      .attr('font-size', 12)
      .text(d => `${d.queda} ft · ${paisPt(d.pais)}`);

  // Nota de cor no canto
  g.append('text')
    .attr('x', larguraUtil + margem.right - 10)
    .attr('y', 10)
    .attr('text-anchor', 'end')
    .attr('font-size', 12)
    .attr('fill', '#d95f02')
    .text('● queda ≥ 400 ft');
}
