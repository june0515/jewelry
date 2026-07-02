import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { JewelryCard } from '../components/JewelryCard';
import { exportJson } from '../utils/exportJson';
import { daysSince } from '../utils/date';
import { Gem, Heart, CalendarCheck, DollarSign } from 'lucide-react';
import { useI18n } from '../i18n';

export function DashboardPage(){
  const {t}=useI18n();
  const items = useLiveQuery(()=>db.jewelry.orderBy('createdAt').reverse().toArray(), []) || [];
  const totalValue = items.reduce((s,i)=>s+(i.purchasePrice||0),0);
  const maintenance = items.filter(i=>i.status==='需保养');
  const unworn = items.filter(i=>daysSince(i.lastWornDate)>45);
  return <section>
    <div className="hero"><div><h1>{t('goodMorning')}</h1><p>{t('wardrobeSubtitle')}</p></div><a className="primary" href="/new">{t('addItem')}</a></div>
    <div className="stats">
      <div><Gem/><span>{t('total')}</span><strong>{items.length}</strong><small>{t('pieces')}</small></div>
      <div><Heart/><span>{t('favorites')}</span><strong>{items.filter(i=>i.status==='常戴').length}</strong><small>{t('pieces')}</small></div>
      <div><DollarSign/><span>{t('totalValue')}</span><strong>${totalValue.toLocaleString()}</strong><small>{t('estimate')}</small></div>
      <div><CalendarCheck/><span>{t('maintenance')}</span><strong>{maintenance.length}</strong><small>{t('pieces')}</small></div>
    </div>
    {unworn.length>0 && <div className="notice">{t('unwornNotice',{count:unworn.length})}</div>}
    <div className="section-title"><h2>{t('recentlyAdded')}</h2><button onClick={()=>exportJson(items)}>{t('exportJson')}</button></div>
    <div className="grid">{items.slice(0,8).map(item=><JewelryCard key={item.id} item={item}/>)}</div>
    {items.length===0 && <div className="empty">{t('emptyDashboard')}</div>}
  </section>
}
