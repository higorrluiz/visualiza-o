import * as d3 from 'd3';

// Desenha as linhas de população ao longo do tempo, uma por país.
// "dados": [{ codigo, pais, ano, milhoes }] ordenado por país e ano
export function drawPopB(seletor, dados) {
  const largura = 800, altura = 450;   // o #popB tem altura 450 no CSS
  const margem = { top: 20, right: 110, bottom: 45, left: 60 };
  const larguraUtil = largura - margem.left - margem.right;
  const alturaUtil  = altura  - margem.top  - margem.bottom;

  const svg = d3.select(seletor);
  svg.selectAll('*').remove();

  const g = svg.append('g')
    .attr('transform', `translate(${margem.left}, ${margem.top})`);

  // Agrupa os pontos por país: Map { código -> lista de pontos }
  const series = d3.group(dados, d => d.codigo);

  // X: ano; Y: população em milhões (ambas lineares, como no exemplo do professor)
  const x = d3.scaleLinear()
    .domain(d3.extent(dados, d => d.ano))
    .range([0, larguraUtil]);

  const y = d3.scaleLinear()
    .domain([0, d3.max(dados, d => d.milhoes) * 1.05])
    .range([alturaUtil, 0]);

  // Eixos
  g.append('g')
    .attr('transform', `translate(0, ${alturaUtil})`)
    .call(d3.axisBottom(x).tickValues(d3.range(1960, 2030, 10)).tickFormat(d3.format('d')));
  g.append('g').call(d3.axisLeft(y).ticks(6));

  g.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('x', -alturaUtil / 2)
    .attr('y', -45)
    .attr('text-anchor', 'middle')
    .attr('font-size', 13)
    .text('População (milhões)');

  // Cores: destaque para Índia e China; os demais em cinza
  const corPais = { IND: '#d95f02', CHN: '#1f78b4' };
  const cor = codigo => corPais[codigo] ?? '#a0a0a0';

  // Gerador de linha: cada ponto vira (x do ano, y da população)
  const linha = d3.line()
    .defined(d => d.milhoes != null)        // ignora anos sem dado
    .x(d => x(d.ano))
    .y(d => y(d.milhoes));

  // Uma linha (path) por país
  g.selectAll('path.linha')
    .data(series)
    .join('path')
      .attr('class', 'linha')
      .attr('fill', 'none')
      .attr('stroke', ([codigo]) => cor(codigo))
      .attr('stroke-width', ([codigo]) => codigo in corPais ? 3 : 1.5)
      .attr('d', ([, pontos]) => linha(pontos));

  // Rótulos diretos no fim de cada linha (no lugar de uma legenda)
  const rotulos = Array.from(series, ([codigo, pontos]) => ({
    codigo,
    pais: pontos[0].pais,
    y: y(pontos[pontos.length - 1].milhoes),
  })).sort((a, b) => a.y - b.y);

  // Evita sobreposição: cada rótulo fica pelo menos 13px abaixo do anterior
  for (let i = 1; i < rotulos.length; i++) {
    rotulos[i].y = Math.max(rotulos[i].y, rotulos[i - 1].y + 13);
  }

  g.selectAll('text.rotulo')
    .data(rotulos)
    .join('text')
      .attr('class', 'rotulo')
      .attr('x', larguraUtil + 6)
      .attr('y', d => d.y)
      .attr('dy', '0.35em')
      .attr('font-size', 12)
      .attr('fill', d => cor(d.codigo))
      .attr('font-weight', d => d.codigo in corPais ? 'bold' : 'normal')
      .text(d => d.pais);

  // Anotação: primeiro ano em que a Índia passa a China
  const india = series.get('IND'), china = series.get('CHN');
  if (india && china) {
    const cruz = india.find((d, i) => d.milhoes > china[i].milhoes);
    if (cruz) {
      g.append('line')
        .attr('x1', x(cruz.ano)).attr('x2', x(cruz.ano))
        .attr('y1', 0).attr('y2', alturaUtil)
        .attr('stroke', '#666').attr('stroke-dasharray', '4 3');

      g.append('text')
        .attr('x', x(cruz.ano) - 6)
        .attr('y', y(700))
        .attr('text-anchor', 'end')
        .attr('font-size', 12)
        .text(`Índia ultrapassa a China (${cruz.ano})`);
    }
  }
}
