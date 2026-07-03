export interface BrandOption {
  name: string;
  logo: string;
  series: string[];
}

export const brandOptions: BrandOption[] = [
  { name: 'Cartier', logo: 'C', series: ['Love','Trinity','Juste un Clou','Panthere','Clash de Cartier','Tank','Ballon Bleu'] },
  { name: 'Van Cleef & Arpels', logo: 'VCA', series: ['Vintage Alhambra','Sweet Alhambra','Magic Alhambra','Frivole','Perlee','Lucky Alhambra'] },
  { name: 'Tiffany & Co.', logo: 'T', series: ['HardWear','Smile','T Collection','Knot','Victoria','Atlas','Elsa Peretti'] },
  { name: 'Chanel', logo: 'CC', series: ['Coco Crush','Camellia','Comete','N°5','Premiere'] },
  { name: 'Dior', logo: 'D', series: ['Rose des Vents','Oui','Dioramour','Mimirose','Dior Tribales'] },
  { name: 'Bvlgari', logo: 'BV', series: ['Serpenti','B.zero1','Divas Dream','Fiorever','Monete'] },
  { name: 'Hermes', logo: 'H', series: ['Clic H','Kelly','Chaine d Ancre','Collier de Chien','Cape Cod'] },
  { name: 'Rolex', logo: 'R', series: ['Datejust','Day-Date','Oyster Perpetual','Submariner','Lady-Datejust'] },
  { name: 'Omega', logo: 'O', series: ['Constellation','Seamaster','Speedmaster','De Ville'] },
  { name: 'Harry Winston', logo: 'HW', series: ['Winston Cluster','Lily Cluster','HW Logo','Emerald'] },
  { name: 'Chopard', logo: 'CP', series: ['Happy Diamonds','Ice Cube','Imperiale','L Heure du Diamant'] },
  { name: 'Chaumet', logo: 'CH', series: ['Bee My Love','Josephine','Liens','Torsade'] },
  { name: 'Boucheron', logo: 'B', series: ['Quatre','Serpent Boheme','Jack de Boucheron','Plume de Paon'] },
  { name: 'Piaget', logo: 'P', series: ['Possession','Rose','Limelight','Polo'] },
  { name: 'Graff', logo: 'G', series: ['Butterfly','Icon','Spiral','Threads'] },
  { name: 'Buccellati', logo: 'BU', series: ['Macri','Opera','Hawaii','Rombi'] },
  { name: 'Messika', logo: 'M', series: ['Move','My Twin','Lucky Move','Gatsby'] },
  { name: 'Mikimoto', logo: 'MI', series: ['M Collection','Jeux de Rubans','Praise to the Sea','Les Petales'] },
  { name: 'Tasaki', logo: 'TA', series: ['Balance','Danger','Kugel','Refined Rebellion'] },
  { name: 'De Beers', logo: 'DB', series: ['Aura','Enchanted Lotus','Dewdrop','My First De Beers'] },
  { name: 'Qeelin', logo: 'Q', series: ['Wulu','Bo Bo','Yu Yi','Xi Xi'] },
  { name: 'Pandora', logo: 'P', series: ['Moments','Timeless','Signature','Me'] },
  { name: 'Swarovski', logo: 'SW', series: ['Millenia','Matrix','Constella','Hyperbola'] },
  { name: 'APM Monaco', logo: 'APM', series: ['Meteorites','Yummy','Mono','Croisette'] },
  { name: 'David Yurman', logo: 'DY', series: ['Cable','Albion','Petite Pavé','Sculpted Cable'] },
  { name: 'Pomellato', logo: 'PO', series: ['Nudo','Iconica','Catene','Sabbia'] },
  { name: '周大福', logo: '周', series: ['传承','故宫文化','迪士尼','MONOLOGUE','HEARTS ON FIRE'] },
  { name: '周生生', logo: '生', series: ['Charme','PROMESSA','MintyGreen','文化祝福'] },
  { name: '六福珠宝', logo: '六', series: ['Goldstyle','Dear Q','囍爱','Love Forever'] },
  { name: '老铺黄金', logo: '老', series: ['古法金','金镶钻','花丝','点翠'] },
  { name: '老凤祥', logo: '凤', series: ['黄金','足金','珐琅','传承'] },
  { name: '潮宏基', logo: '潮', series: ['花丝糖果','东方美学','彩金','哆啦A梦'] },
  { name: 'I Do', logo: 'ID', series: ['Tower','Princess','Love Line','香榭之吻'] },
  { name: 'DR钻戒', logo: 'DR', series: ['My Heart','True Love','Forever','Believe'] },
  { name: '其他', logo: '+', series: ['Custom','Vintage','Unknown'] },
];

export function getBrandSeries(brand?: string) {
  return brandOptions.find(option => option.name === brand)?.series || [];
}
