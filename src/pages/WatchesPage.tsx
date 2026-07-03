import { useLiveQuery } from 'dexie-react-hooks';
import { PlusCircle, Watch } from 'lucide-react';
import { JewelryCard } from '../components/JewelryCard';
import { db } from '../db/db';
import { useI18n } from '../i18n';

export function WatchesPage() {
  const { t } = useI18n();
  const items = useLiveQuery(() => db.jewelry.orderBy('createdAt').reverse().toArray(), []) || [];
  const watches = items.filter(item => item.category === '手表');
  const totalValue = watches.reduce((sum, item) => sum + (item.purchasePrice || item.referencePrice || 0), 0);

  return <section>
    <div className="watch-hero">
      <div>
        <span>{t('watches')}</span>
        <h1>{t('watchCollection')}</h1>
        <p>{t('watchSubtitle')}</p>
      </div>
      <a className="primary" href="/new"><PlusCircle size={18}/>{t('addWatch')}</a>
    </div>
    <div className="watch-summary">
      <div><Watch/><span>{t('watchCount')}</span><strong>{watches.length}</strong></div>
      <div><span>{t('watchValue')}</span><strong>${totalValue.toLocaleString()}</strong><small>{t('estimate')}</small></div>
    </div>
    <div className="grid">{watches.map(item => <JewelryCard key={item.id} item={item}/>)}</div>
    {watches.length === 0 && <div className="empty">{t('noWatches')}</div>}
  </section>;
}
