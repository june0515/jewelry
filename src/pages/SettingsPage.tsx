import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { daysSince } from '../utils/date';
import { useI18n } from '../i18n';

export function SettingsPage() {
  const { t } = useI18n();
  const items = useLiveQuery(() => db.jewelry.toArray(), []) || [];
  const grouped = items.reduce<Record<string, typeof items>>((acc, item) => {
    const key = item.boxName || item.storageLocation || t('none');
    acc[key] = acc[key] || [];
    acc[key].push(item);
    return acc;
  }, {});
  const careItems = items.filter(item => item.needsPolish || item.needsRepair || daysSince(item.lastCleanedDate) > 180 || (item.nextCareDate && item.nextCareDate <= new Date().toISOString().slice(0,10)));

  return <section>
    <div className="section-title"><h1>{t('settings')}</h1></div>
    <div className="settings-grid">
      <div className="analysis-card"><h2>{t('storageMap')}</h2><div className="storage-map">{Object.entries(grouped).map(([box, boxItems])=><div key={box}><h3>{box}</h3>{boxItems.map(item=><a key={item.id} href={`/items/${item.id}`}><strong>{item.name}</strong><span>{[item.trayLevel,item.compartment].filter(Boolean).join(' / ') || item.storageLocation || t('none')}</span></a>)}</div>)}</div></div>
      <div className="analysis-card"><h2>{t('careReminders')}</h2><div className="mini-list warn-list">{careItems.length ? careItems.map(item=><a key={item.id} href={`/items/${item.id}`}><strong>{item.name}</strong><span>{item.nextCareDate || item.lastCleanedDate || t('needsPolish')}</span></a>) : <p>{t('noIdleItems')}</p>}</div></div>
    </div>
  </section>;
}
