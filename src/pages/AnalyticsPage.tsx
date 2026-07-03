import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { useI18n } from '../i18n';

function topEntries(values: string[]) {
  const counts = values.filter(Boolean).reduce<Record<string, number>>((acc, value) => {
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
  return Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,6);
}

function BarList({items,total}:{items:[string,number][];total:number}) {
  return <div className="bar-list">{items.map(([name,count])=><div key={name}><span>{name}</span><strong>{Math.round((count / Math.max(total, 1)) * 100)}%</strong><i style={{width:`${(count / Math.max(total, 1)) * 100}%`}}/></div>)}</div>;
}

export function AnalyticsPage() {
  const { t } = useI18n();
  const items = useLiveQuery(() => db.jewelry.toArray(), []) || [];
  const purchaseValue = items.reduce((sum,item)=>sum+(item.purchasePrice||0),0);
  const currentValue = items.reduce((sum,item)=>sum+(item.referencePrice||item.purchasePrice||0),0);
  const brandData = topEntries(items.map(item=>item.brand||''));
  const materialData = topEntries(items.flatMap(item=>item.materials));
  const colorData = topEntries(items.flatMap(item=>item.colors));

  return <section>
    <div className="section-title"><h1>{t('analytics')}</h1></div>
    <div className="analysis-grid">
      <div className="analysis-card"><h2>{t('brandAnalysis')}</h2><BarList items={brandData} total={items.length}/></div>
      <div className="analysis-card"><h2>{t('materialAnalysis')}</h2><BarList items={materialData} total={items.length}/></div>
      <div className="analysis-card"><h2>{t('colorAnalysis')}</h2><BarList items={colorData} total={items.length}/></div>
      <div className="analysis-card"><h2>{t('valueAnalysis')}</h2><div className="value-strip stacked"><div><span>{t('price')}</span><strong>${purchaseValue.toLocaleString()}</strong></div><div><span>{t('marketValue')}</span><strong>${currentValue.toLocaleString()}</strong></div><div><span>{t('valueChange')}</span><strong>{purchaseValue ? `${(((currentValue-purchaseValue)/purchaseValue)*100).toFixed(1)}%` : t('none')}</strong></div></div></div>
    </div>
  </section>;
}
