import * as d3 from 'd3';
import { GRADE } from './estados.js';

// Desenha o tile grid map: um quadrado por estado, colorido pelo doce campeão.
// "estados": [{ estado, doce }]   "ordemDoces": doces do mais ao menos frequente
export function drawCandyB(seletor, estados, ordemDoces) {
  const lado = 46;                       // tamanho de cada quadrado (px)
  const gap = 3;                         // espaço entre quadrados
  const origem = { x: 15, y: 15 };       // deslocamento da grade dentro do svg

  const svg = d3.select(seletor);
  svg.selectAll('*').remove();

  // Escala de cor: uma cor para cada doce (domínio = lista de doces)
  const cor = d3.scaleOrdinal(d3.schemeTableau10).domain(ordemDoces);

  // Junta cada linha do CSV com sua posição na grade
  const tiles = estados
    .filter(d => GRADE[d.estado])                      // ignora nomes sem posição
    .map(d => ({
      ...d,
      col: GRADE[d.estado][0],
      row: GRADE[d.estado][1],
      sigla: GRADE[d.estado][2],
    }));

  // Um grupo <g> por estado, posicionado pela coluna e linha
  const g = svg.append('g')
    .selectAll('g')
    .data(tiles)
    .join('g')
      .attr('transform', d =>
        `translate(${origem.x + d.col * (lado + gap)}, ${origem.y + d.row * (lado + gap)})`);

  // O quadrado colorido
  g.append('rect')
    .attr('width', lado)
    .attr('height', lado)
    .attr('rx', 4)
    .attr('fill', d => cor(d.doce));

  // A sigla do estado; texto preto ou branco conforme o brilho do fundo
  g.append('text')
    .attr('x', lado / 2)
    .attr('y', lado / 2)
    .attr('dy', '0.35em')
    .attr('text-anchor', 'middle')
    .attr('font-size', 14)
    .attr('fill', d => d3.lab(cor(d.doce)).l > 60 ? '#000' : '#fff')
    .text(d => d.sigla);

  // Tooltip simples: passar o mouse mostra o nome completo e o doce
  g.append('title').text(d => `${d.estado}: ${d.doce}`);

  // Legenda à direita: um quadradinho + nome para cada doce
  const legenda = svg.append('g').attr('transform', 'translate(570, 25)');

  const item = legenda.selectAll('g')
    .data(ordemDoces)
    .join('g')
      .attr('transform', (d, i) => `translate(0, ${i * 26})`);

  item.append('rect').attr('width', 16).attr('height', 16).attr('rx', 3).attr('fill', d => cor(d));
  item.append('text').attr('x', 24).attr('y', 8).attr('dy', '0.35em').attr('font-size', 13).text(d => d);
}
