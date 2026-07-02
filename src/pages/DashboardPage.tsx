import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { JewelryCard } from '../components/JewelryCard';
import { exportJson } from '../utils/exportJson';
import { daysSince } from '../utils/date';
import { Gem, Heart, CalendarCheck, DollarSign } from 'lucide-react';

export function DashboardPage(){
  const items = useLiveQuery(()=>db.jewelry.orderBy('createdAt').reverse().toArray(), []) || [];
  const totalValue = items.reduce((s,i)=>s+(i.purchasePrice||0),0);
  const maintenance = items.filter(i=>i.status==='需保养');
  const unworn = items.filter(i=>daysSince(i.lastWornDate)>45);
  return <section>
    <div className="hero"><div><h1>早安，June! ✨</h1><p>你的首饰衣橱 · 记录每一次闪耀</p></div><a className="primary" href="/new">+ 添加首饰</a></div>
    <div className="stats">
      <div><Gem/><span>总数</span><strong>{items.length}</strong><small>件首饰</small></div>
      <div><Heart/><span>常戴</span><strong>{items.filter(i=>i.status==='常戴').length}</strong><small>件</small></div>
      <div><DollarSign/><span>总价值</span><strong>${totalValue.toLocaleString()}</strong><small>估算</small></div>
      <div><CalendarCheck/><span>需保养</span><strong>{maintenance.length}</strong><small>件</small></div>
    </div>
    {unworn.length>0 && <div className="notice">有 {unworn.length} 件首饰超过 45 天未佩戴，可以翻出来搭配一下。</div>}
    <div className="section-title"><h2>最近添加</h2><button onClick={()=>exportJson(items)}>导出 JSON</button></div>
    <div className="grid">{items.slice(0,8).map(item=><JewelryCard key={item.id} item={item}/>)}</div>
    {items.length===0 && <div className="empty">还没有首饰，先添加你的第一件项链 / 戒指吧。</div>}
  </section>
}
