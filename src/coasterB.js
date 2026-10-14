import * as d3 from 'd3';
import { paisPt } from './paises';

// Desenha quantas montanhas-russas cada país tem no ranking.
// "dados": [{ pais, qtd, maior }] ordenado por quantidade
export function drawCoasterB(seletor, dados) {
  const largura = 800, altura = 400;
  const margem = { top: 20, right: 190, bottom: 45, left: 90 };
  const larguraUtil = largura - margem.left - margem.right;
  const alturaUtil  = altura  - margem.top  - margem.bottom;

  const svg = d3.select(seletor);
  svg.selectAll('*').remove();

  const g = svg.append('g')
    .attr('transform', `translate(${margem.left}, ${margem.top})`);

  const maxQtd = d3.max(dados, d => d.qtd);

  // X: número de atrações (inteiros); Y: país
  const x = d3.scaleLinear().domain([0, maxQtd]).range([0, larguraUtil]);

  const y = d3.scaleBand()
    .domain(dados.map(d => paisPt(d.pais)))
    .range([0, alturaUtil])
    .padding(0.25);

  // Eixo X só com números inteiros (não existe "meia montanha-russa")
  g.append('g')
    .attr('transform', `translate(0, ${alturaUtil})`)
    .call(d3.axisBottom(x).tickValues(d3.range(0, maxQtd + 1)).tickFormat(d3.format('d')));
  g.append('g').call(d3.axisLeft(y).tickSize(0));

  g.append('text')
    .attr('x', larguraUtil / 2)
    .attr('y', alturaUtil + 38)
    .attr('text-anchor', 'middle')
    .attr('font-size', 13)
    .text('Montanhas-russas no ranking (nº de atrações)');

  // Destaque só para o país com mais atrações (o primeiro, pois já está ordenado)
  const cor = (d, i) => i === 0 ? '#d95f02' : '#9a9a9a';

  // Uma barra por país
  g.selectAll('rect')
    .data(dados)
    .join('rect')
      .attr('x', 0)
      .attr('y', d => y(paisPt(d.pais)))
      .attr('width', d => x(d.qtd))
      .attr('height', y.bandwidth())
      .attr('fill', cor);

  // Rótulo: quantidade e a maior queda do país
  g.selectAll('text.valor')
    .data(dados)
    .join('text')
      .attr('class', 'valor')
      .attr('x', d => x(d.qtd) + 6)
      .attr('y', d => y(paisPt(d.pais)) + y.bandwidth() / 2)
      .attr('dy', '0.35em')
      .attr('font-size', 12)
      .text(d => `${d.qtd} (maior queda: ${d.maior} ft)`);
}
