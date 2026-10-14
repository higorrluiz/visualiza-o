import * as d3 from 'd3';

// Mapa de calor: doces (linhas) x posição no ranking do estado (colunas).
// "dados": [{ doce, lugar, n }]  n = nº de estados em que o doce ficou naquele lugar
export function drawCandyA(seletor, dados) {
  const largura = 800, altura = 400;
  const margem = { top: 55, right: 20, bottom: 15, left: 200 };
  const larguraCel = 105;                 // largura de cada coluna
  const lugares = [1, 2, 3];
  const rotulos = { 1: '1º lugar', 2: '2º lugar', 3: '3º lugar' };
  const alturaUtil = altura - margem.top - margem.bottom;

  const svg = d3.select(seletor);
  svg.selectAll('*').remove();

  const g = svg.append('g')
    .attr('transform', `translate(${margem.left}, ${margem.top})`);

  // Total de aparições no top 3 por doce (define a ordem das linhas)
  const totais = d3.rollup(dados, v => d3.sum(v, d => d.n), d => d.doce);
  const doces = Array.from(totais.keys())
    .sort((a, b) => d3.descending(totais.get(a), totais.get(b)) || d3.ascending(a, b));

  // Escalas de posição: colunas = lugar, linhas = doce
  const x = d3.scaleBand().domain(lugares).range([0, larguraCel * lugares.length]).padding(0.06);
  const y = d3.scaleBand().domain(doces).range([0, alturaUtil]).padding(0.06);

  // Uma célula para cada combinação doce x lugar (0 quando não há registro)
  const mapa = new Map(dados.map(d => [`${d.doce}|${d.lugar}`, d.n]));
  const celulas = doces.flatMap(doce =>
    lugares.map(lugar => ({ doce, lugar, n: mapa.get(`${doce}|${lugar}`) ?? 0 })));

  // Escala de cor sequencial: quanto mais estados, mais escuro
  const maximo = d3.max(celulas, d => d.n);
  const cor = d3.scaleSequential(d3.interpolateBlues).domain([0, maximo]);

  // Nomes dos doces à esquerda
  g.append('g')
    .call(d3.axisLeft(y).tickSize(0))
    .select('.domain').remove();

  // Cabeçalhos das colunas
  g.append('text')
    .attr('x', 0).attr('y', -32)
    .attr('font-size', 13)
    .text('Nº de estados em cada posição do ranking');

  g.selectAll('text.cab')
    .data(lugares)
    .join('text')
      .attr('class', 'cab')
      .attr('x', d => x(d) + x.bandwidth() / 2)
      .attr('y', -10)
      .attr('text-anchor', 'middle')
      .attr('font-size', 13)
      .text(d => rotulos[d]);

  // As células coloridas
  g.selectAll('rect')
    .data(celulas)
    .join('rect')
      .attr('x', d => x(d.lugar))
      .attr('y', d => y(d.doce))
      .attr('width', x.bandwidth())
      .attr('height', y.bandwidth())
      .attr('rx', 3)
      .attr('fill', d => cor(d.n));

  // Número dentro da célula (branco nas células escuras; traço nas vazias)
  g.selectAll('text.valor')
    .data(celulas)
    .join('text')
      .attr('class', 'valor')
      .attr('x', d => x(d.lugar) + x.bandwidth() / 2)
      .attr('y', d => y(d.doce) + y.bandwidth() / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', 'middle')
      .attr('font-size', 14)
      .attr('fill', d => d.n === 0 ? '#bbb' : (d.n > maximo * 0.55 ? '#fff' : '#000'))
      .text(d => d.n === 0 ? '–' : d.n);

  // Coluna de total (1º + 2º + 3º)
  const xTotal = larguraCel * lugares.length + 30;
  g.append('text')
    .attr('x', xTotal).attr('y', -10)
    .attr('text-anchor', 'middle')
    .attr('font-size', 13)
    .attr('font-weight', 'bold')
    .text('Total');

  g.selectAll('text.total')
    .data(doces)
    .join('text')
      .attr('class', 'total')
      .attr('x', xTotal)
      .attr('y', d => y(d) + y.bandwidth() / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', 'middle')
      .attr('font-size', 14)
      .attr('font-weight', 'bold')
      .text(d => totais.get(d));
}