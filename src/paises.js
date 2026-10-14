// Códigos que NÃO são países: regiões, grupos de renda e o total mundial.
// Sem excluir estes, "World" apareceria como o país mais populoso.
export const AGREGADOS = [
  'AFE','AFW','ARB','CEB','CSS','EAP','EAR','EAS','ECA','ECS','EMU','EUU',
  'HIC','HPC','IBD','IBT','IDA','IDB','IDX','INX','LAC','LCN','LDC','LIC',
  'LMC','LMY','LTE','MEA','MIC','MNA','NAC','OED','OSS','PRE','PSS','PST',
  'SAS','SSA','SSF','SST','TEA','TEC','TLA','TMN','TSA','TSS','UMC','WLD',
];

// Lista pronta para usar dentro de um SQL: 'AFE','AFW',...
export const AGREGADOS_SQL = AGREGADOS.map(c => `'${c}'`).join(',');

// Nomes em português para os países que aparecem nos gráficos
const NOMES = {
  'India': 'Índia', 'United States': 'EUA', 'Indonesia': 'Indonésia',
  'Pakistan': 'Paquistão', 'Nigeria': 'Nigéria', 'Brazil': 'Brasil',
  'Russian Federation': 'Rússia', 'Ethiopia': 'Etiópia', 'Mexico': 'México',
  'Japan': 'Japão', 'Egypt, Arab Rep.': 'Egito', 'Philippines': 'Filipinas',
  'Congo, Dem. Rep.': 'R.D. Congo', 'Viet Nam': 'Vietnã',
};

// Devolve o nome em português, ou o original se não estiver na lista
export const nomePt = nome => NOMES[nome] ?? nome;

// Nomes de países em português (para as montanhas-russas)
const PAISES_PT = {
  'USA': 'EUA', 'Spain': 'Espanha', 'Japan': 'Japão',
  'Canada': 'Canadá', 'Poland': 'Polônia', 'China': 'China',
};
export const paisPt = p => PAISES_PT[p] ?? p;