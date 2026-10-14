import * as d3 from 'd3';

// Formata números no padrão brasileiro (1.464 e 17,8)
const fmtMilhoes = d => d.toLocaleString('pt-BR', { maximumFractionDigits: 0 });
const fmtPct = d => d.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

// Desenha o ranking dos países mais populosos (barras horizontais).
// "dados": [{ codigo, pais, milhoes, pct }] já ordenado do maior para o menor
export function drawPopA(seletor, dados) {
  const largura = 800, altura = 400;
  const margem = { top: 15, right: 150, bottom: 40, left: 110 };  // right grande p/ caber os rótulos
  const larguraUtil = largura - margem.left - margem.right;
  const alturaUtil  = altura  - margem.top  - margem.bottom;

  const svg = d3.select(seletor);
  svg.selectAll('*').remove();

  const g = svg.append('g')
    .attr('transform', `translate(${margem.left}, ${margem.top})`);

  // X: população em milhões (quantitativo); Y: país (categórico)
  const x = d3.scaleLinear()
    .domain([0, d3.max(dados, d => d.milhoes)])
    .range([0, larguraUtil]);

  const y = d3.scaleBand()
    .domain(dados.map(d => d.pais))
    .range([0, alturaUtil])
    .padding(0.2);

  // Eixos
  g.append('g')
    .attr('transform', `translate(0, ${alturaUtil})`)
    .call(d3.axisBottom(x).ticks(6));
  g.append('g').call(d3.axisLeft(y));

  // Título do eixo X
  g.append('text')
    .attr('x', larguraUtil / 2)
    .attr('y', alturaUtil + 35)
    .attr('text-anchor', 'middle')
    .attr('font-size', 13)
    .text('População em 2025 (milhões)');

  // Destaque só para Índia e China; os demais ficam em cinza neutro
  const destaque = new Set(['IND', 'CHN']);
  const cor = d => destaque.has(d.codigo) ? '#d95f02' : '#b0b0b0';

  // Uma barra por país
  g.selectAll('rect')
    .data(dados)
    .join('rect')
      .attr('x', 0)
      .attr('y', d => y(d.pais))
      .attr('width', d => x(d.milhoes))
      .attr('height', y.bandwidth())
      .attr('fill', cor);

  // Rótulo no fim da barra: valor em milhões e % da população mundial
  g.selectAll('text.valor')
    .data(dados)
    .join('text')
      .attr('class', 'valor')
      .attr('x', d => x(d.milhoes) + 6)
      .attr('y', d => y(d.pais) + y.bandwidth() / 2)
      .attr('dy', '0.35em')
      .attr('font-size', 12)
      .text(d => `${fmtMilhoes(d.milhoes)} (${fmtPct(d.pct)}%)`);
}
