import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { JewelryCard } from '../components/JewelryCard';
import { JewelryCategory, JewelryStatus } from '../types/jewelry';
import { useI18n } from '../i18n';

const categories: JewelryCategory[] = ['项链','耳环','戒指','手链','手表','胸针','脚链','其他'];
const statuses: JewelryStatus[] = ['常戴','收藏','需保养','已遗失','想转卖'];

export function ListPage(){
  const {t,label}=useI18n();
  const items = useLiveQuery(()=>db.jewelry.orderBy('createdAt').reverse().toArray(), []) || [];
  const [q,setQ]=useState(''); const [cat,setCat]=useState(''); const [status,setStatus]=useState('');
  const filtered = useMemo(()=>items.filter(i=>{
    const text = `${i.name} ${i.brand||''} ${i.materials.join(' ')}`.toLowerCase();
    return (!q || text.includes(q.toLowerCase())) && (!cat || i.category===cat) && (!status || i.status===status);
  }),[items,q,cat,status]);
  return <section><div className="section-title"><h1>{t('allJewelry')}</h1><a className="primary small" href="/new">{t('add')}</a></div>
  <div className="filters"><input placeholder={t('searchInput')} value={q} onChange={e=>setQ(e.target.value)}/><select value={cat} onChange={e=>setCat(e.target.value)}><option value="">{t('allCategories')}</option>{categories.map(c=><option key={c} value={c}>{label(c)}</option>)}</select><select value={status} onChange={e=>setStatus(e.target.value)}><option value="">{t('allStatuses')}</option>{statuses.map(s=><option key={s} value={s}>{label(s)}</option>)}</select></div>
  <div className="grid">{filtered.map(item=><JewelryCard key={item.id} item={item}/>)}</div></section>
}
