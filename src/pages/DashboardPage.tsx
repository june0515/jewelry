import { useEffect, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { JewelryCard } from '../components/JewelryCard';
import { exportJson } from '../utils/exportJson';
import { daysSince } from '../utils/date';
import { CalendarCheck, CircleDot, Diamond, DollarSign, Gem, Heart, Sparkles, Tags } from 'lucide-react';
import { useI18n } from '../i18n';

function monthKey(date: Date) {
  return date.toISOString().slice(0, 7);
}

function greetingKey(date: Date) {
  const hour = date.getHours();
  if (hour < 12) return 'goodMorning';
  if (hour < 18) return 'goodAfternoon';
  return 'goodEvening';
}

function localTimeLabel(date: Date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function DashboardPage(){
  const {t}=useI18n();
  const [now,setNow]=useState(()=>new Date());
  const items = useLiveQuery(()=>db.jewelry.orderBy('createdAt').reverse().toArray(), []) || [];
  const wearEvents = useLiveQuery(()=>db.wearEvents.orderBy('wornDate').reverse().toArray(), []) || [];
  const currentMonth = monthKey(now);
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

  useEffect(()=>{
    const timer = window.setInterval(()=>setNow(new Date()), 60_000);
    return ()=>window.clearInterval(timer);
  },[]);

  return <section className="dashboard-page">
    <div className="hero dashboard-hero">
      <div className="hero-copy">
        <div className="hero-kicker"><span>{t('luxuryManager')}</span><em>{t('localTime')}: {localTimeLabel(now)}</em></div>
        <h1>{t(greetingKey(now))}</h1>
        <p>{t('wardrobeSubtitle')}</p>
        <div className="hero-insights">
          <span>{items.length} {t('pieces')}</span>
          <span>{brandCount} {t('brandCount')}</span>
          <span>{monthlyWear} {t('monthlyWear')}</span>
        </div>
      </div>
      <div className="hero-action">
        <div className="jewel-visual" aria-hidden="true">
          <span><Diamond size={22}/></span>
          <span><CircleDot size={20}/></span>
          <span><Sparkles size={18}/></span>
        </div>
        <div className="hero-jewel"><span>{todayPick?.brand || t('todayPick')}</span><strong>{todayPick?.name || t('emptyDashboard')}</strong></div>
        <a className="primary" href="/new">{t('addItem')}</a>
      </div>
    </div>
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
        {todayPick ? <JewelryCard item={todayPick}/> : <div className="empty compact illustrated-empty"><Gem size={28}/><span>{t('emptyDashboard')}</span></div>}
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
