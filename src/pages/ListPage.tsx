import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { JewelryCard } from '../components/JewelryCard';
import { JewelryCategory, JewelryStatus } from '../types/jewelry';

const categories: JewelryCategory[] = ['项链','耳环','戒指','手链','手表','胸针','脚链','其他'];
const statuses: JewelryStatus[] = ['常戴','收藏','需保养','已遗失','想转卖'];

export function ListPage(){
  const items = useLiveQuery(()=>db.jewelry.orderBy('createdAt').reverse().toArray(), []) || [];
  const [q,setQ]=useState(''); const [cat,setCat]=useState(''); const [status,setStatus]=useState('');
  const filtered = useMemo(()=>items.filter(i=>{
    const text = `${i.name} ${i.brand||''} ${i.materials.join(' ')}`.toLowerCase();
    return (!q || text.includes(q.toLowerCase())) && (!cat || i.category===cat) && (!status || i.status===status);
  }),[items,q,cat,status]);
  return <section><div className="section-title"><h1>所有首饰</h1><a className="primary small" href="/new">+ 添加</a></div>
  <div className="filters"><input placeholder="搜索名称/品牌/材质" value={q} onChange={e=>setQ(e.target.value)}/><select value={cat} onChange={e=>setCat(e.target.value)}><option value="">全部分类</option>{categories.map(c=><option key={c}>{c}</option>)}</select><select value={status} onChange={e=>setStatus(e.target.value)}><option value="">全部状态</option>{statuses.map(s=><option key={s}>{s}</option>)}</select></div>
  <div className="grid">{filtered.map(item=><JewelryCard key={item.id} item={item}/>)}</div></section>
}
