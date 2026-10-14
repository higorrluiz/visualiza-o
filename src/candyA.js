import * as d3 from 'd3';

// Desenha o ranking de doces (barras horizontais) dentro do svg indicado
export function drawCandyA(seletor, dados) {
  const largura = 800, altura = 400;   // mesmo tamanho definido no index.css
  const margem = { top: 20, right: 30, bottom: 40, left: 200 };
  const larguraUtil = largura - margem.left - margem.right;
  const alturaUtil  = altura  - margem.top  - margem.bottom;

  const svg = d3.select(seletor);
  svg.selectAll('*').remove();   // limpa antes de desenhar

  // Grupo deslocado pelas margens
  const g = svg.append('g')
    .attr('transform', `translate(${margem.left}, ${margem.top})`);

  // X: contagem de estados (numérico); Y: nome do doce (categórico)
  const x = d3.scaleLinear()
    .domain([0, d3.max(dados, d => d.total)])
    .range([0, larguraUtil]);

  const y = d3.scaleBand()
    .domain(dados.map(d => d.doce))
    .range([0, alturaUtil])
    .padding(0.2);

  // Eixos
  g.append('g').attr('transform', `translate(0, ${alturaUtil})`).call(d3.axisBottom(x));
  g.append('g').call(d3.axisLeft(y));

  // Uma barra por doce
  g.selectAll('rect')
    .data(dados)
    .join('rect')
      .attr('x', 0)
      .attr('y', d => y(d.doce))
      .attr('width', d => x(d.total))
      .attr('height', y.bandwidth())
      .attr('fill', 'steelblue');

  // Valor no fim de cada barra
  g.selectAll('text.valor')
    .data(dados)
    .join('text')
      .attr('class', 'valor')
      .attr('x', d => x(d.total) + 5)
      .attr('y', d => y(d.doce) + y.bandwidth() / 2)
      .attr('dy', '0.35em')
      .text(d => d.total);
}
