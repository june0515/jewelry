import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { JewelryCard } from '../components/JewelryCard';
import { exportJson } from '../utils/exportJson';
import { daysSince } from '../utils/date';
import { CalendarCheck, DollarSign, Gem, Heart, Tags } from 'lucide-react';
import { useI18n } from '../i18n';

function monthKey(date: Date) {
  return date.toISOString().slice(0, 7);
}

export function DashboardPage(){
  const {t}=useI18n();
  const items = useLiveQuery(()=>db.jewelry.orderBy('createdAt').reverse().toArray(), []) || [];
  const wearEvents = useLiveQuery(()=>db.wearEvents.orderBy('wornDate').reverse().toArray(), []) || [];
  const currentMonth = monthKey(new Date());
  const totalValue = items.reduce((s,i)=>s+(i.referencePrice || i.purchasePrice || 0),0);
  const brandCount = new Set(items.map(i=>i.brand).filter(Boolean)).size;
  const monthlyWear = wearEvents.filter(event => event.wornDate.startsWith(currentMonth)).length;
  const recentlyWorn = wearEvents.slice(0,5);
  const idleItems = items.filter(i=>daysSince(i.lastWornDate)>60).slice(0,5);
  const todayPick = useMemo(() => {
    if (!items.length) return undefined;
    const index = new Date().getDate() % items.length;
    return items[index];
  }, [items]);
  const watches = items.filter(i=>i.category==='手表');
  const watchValue = watches.reduce((s,i)=>s+(i.purchasePrice||i.referencePrice||0),0);

  return <section className="dashboard-page">
    <div className="hero dashboard-hero"><div><span>{t('luxuryManager')}</span><h1>{t('goodMorning')}</h1><p>{t('wardrobeSubtitle')}</p></div><a className="primary" href="/new">{t('addItem')}</a></div>
    <div className="stats dashboard-stats">
      <div><Gem/><span>{t('totalCollection')}</span><strong>{items.length}</strong><small>{t('pieces')}</small></div>
      <div><DollarSign/><span>{t('totalValue')}</span><strong>${totalValue.toLocaleString()}</strong><small>{t('estimate')}</small></div>
      <div><Heart/><span>{t('monthlyWear')}</span><strong>{monthlyWear}</strong><small>{t('times')}</small></div>
      <div><Tags/><span>{t('brandCount')}</span><strong>{brandCount}</strong><small>{t('pieces')}</small></div>
    </div>
    <div className="watch-band">
      <div><CalendarCheck/><span>{t('watchCollection')}</span><strong>{watches.length}</strong><small>${watchValue.toLocaleString()} · {t('estimate')}</small></div>
      <a className="ghost" href="/watches">{t('watches')}</a>
    </div>
    <div className="dashboard-panels">
      <div className="panel">
        <div className="section-title"><h2>{t('todayPick')}</h2></div>
        {todayPick ? <JewelryCard item={todayPick}/> : <div className="empty compact">{t('emptyDashboard')}</div>}
      </div>
      <div className="panel">
        <div className="section-title"><h2>{t('recentlyWorn')}</h2><a className="ghost" href="/wear-history">{t('wearHistory')}</a></div>
        <div className="mini-list">{recentlyWorn.length ? recentlyWorn.map(event=><a key={event.id} href={`/items/${event.jewelryId}`}><strong>{event.jewelryName}</strong><span>{event.wornDate}</span></a>) : <p>{t('noWearHistory')}</p>}</div>
      </div>
      <div className="panel">
        <div className="section-title"><h2>{t('idleReminder')}</h2></div>
        <div className="mini-list warn-list">{idleItems.length ? idleItems.map(item=><a key={item.id} href={`/items/${item.id}`}><strong>{item.name}</strong><span>{item.lastWornDate || t('notRecorded')}</span></a>) : <p>{t('noIdleItems')}</p>}</div>
      </div>
    </div>
    <div className="section-title"><h2>{t('recentlyAdded')}</h2><button onClick={()=>exportJson(items)}>{t('exportJson')}</button></div>
    <div className="grid">{items.slice(0,6).map(item=><JewelryCard key={item.id} item={item}/>)}</div>
    {items.length===0 && <div className="empty">{t('emptyDashboard')}</div>}
  </section>;
}
