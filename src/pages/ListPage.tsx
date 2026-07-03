import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { Grid2X2, List } from 'lucide-react';
import { db } from '../db/db';
import { JewelryCard } from '../components/JewelryCard';
import { JewelryCategory, JewelryMaterial, JewelryStatus } from '../types/jewelry';
import { useI18n } from '../i18n';

const categories: JewelryCategory[] = ['项链','耳环','戒指','手链','手表','胸针','脚链','其他'];
const materials: JewelryMaterial[] = ['925银','18K金','14K金','铂金','珍珠','钻石','天然石','合金','玫瑰金','其他'];
const statuses: JewelryStatus[] = ['常戴','收藏','需保养','已遗失','想转卖'];
const colors = ['金色','银色','玫瑰金','珍珠白','白色','黑色','红色','粉色','蓝色','绿色','紫色','透明','彩色','其他'];

export function ListPage(){
  const {t,label}=useI18n();
  const items = useLiveQuery(()=>db.jewelry.orderBy('createdAt').reverse().toArray(), []) || [];
  const [q,setQ]=useState('');
  const [cat,setCat]=useState('');
  const [status,setStatus]=useState('');
  const [brand,setBrand]=useState('');
  const [material,setMaterial]=useState('');
  const [color,setColor]=useState('');
  const [favorite,setFavorite]=useState(false);
  const [sort,setSort]=useState('createdAt');
  const [view,setView]=useState<'grid'|'list'>('grid');
  const brands = useMemo(() => Array.from(new Set(items.map(item=>item.brand).filter(Boolean))).sort(), [items]);
  const filtered = useMemo(()=>items.filter(i=>{
    const text = `${i.name} ${i.brand||''} ${i.series||''} ${i.materials.join(' ')}`.toLowerCase();
    return (!q || text.includes(q.toLowerCase()))
      && (!cat || i.category===cat)
      && (!status || i.status===status)
      && (!brand || i.brand===brand)
      && (!material || i.materials.includes(material as JewelryMaterial))
      && (!color || i.colors.includes(color))
      && (!favorite || i.status==='常戴');
  }).sort((a,b)=>{
    if (sort === 'lastWornDate') return (b.lastWornDate || '').localeCompare(a.lastWornDate || '');
    if (sort === 'purchaseDate') return (b.purchaseDate || '').localeCompare(a.purchaseDate || '');
    if (sort === 'price') return (b.purchasePrice || b.referencePrice || 0) - (a.purchasePrice || a.referencePrice || 0);
    if (sort === 'brand') return (a.brand || '').localeCompare(b.brand || '');
    return (b.createdAt || '').localeCompare(a.createdAt || '');
  }),[items,q,cat,status,brand,material,color,favorite,sort]);

  return <section>
    <div className="section-title"><h1>{t('allJewelry')}</h1><a className="primary small" href="/new">{t('add')}</a></div>
    <div className="collection-toolbar">
      <input placeholder={t('searchInput')} value={q} onChange={e=>setQ(e.target.value)}/>
      <select value={sort} onChange={e=>setSort(e.target.value)}><option value="createdAt">{t('recentlyAdded')}</option><option value="lastWornDate">{t('recentlyWornSort')}</option><option value="purchaseDate">{t('purchaseDateSort')}</option><option value="price">{t('priceSort')}</option><option value="brand">{t('brandSort')}</option></select>
      <div className="segmented"><button className={view==='grid'?'on':''} onClick={()=>setView('grid')}><Grid2X2 size={16}/>{t('gridView')}</button><button className={view==='list'?'on':''} onClick={()=>setView('list')}><List size={16}/>{t('listView')}</button></div>
    </div>
    <div className="filters advanced-filters">
      <select value={brand} onChange={e=>setBrand(e.target.value)}><option value="">{t('allBrands')}</option>{brands.map(b=><option key={b} value={b}>{b}</option>)}</select>
      <select value={cat} onChange={e=>setCat(e.target.value)}><option value="">{t('allCategories')}</option>{categories.map(c=><option key={c} value={c}>{label(c)}</option>)}</select>
      <select value={material} onChange={e=>setMaterial(e.target.value)}><option value="">{t('allMaterials')}</option>{materials.map(m=><option key={m} value={m}>{label(m)}</option>)}</select>
      <select value={color} onChange={e=>setColor(e.target.value)}><option value="">{t('allColors')}</option>{colors.map(c=><option key={c} value={c}>{c}</option>)}</select>
      <select value={status} onChange={e=>setStatus(e.target.value)}><option value="">{t('allStatuses')}</option>{statuses.map(s=><option key={s} value={s}>{label(s)}</option>)}</select>
      <label className="filter-check"><input type="checkbox" checked={favorite} onChange={e=>setFavorite(e.target.checked)}/>{t('frequentOnly')}</label>
    </div>
    {view === 'grid' ? <div className="grid">{filtered.map(item=><JewelryCard key={item.id} item={item}/>)}</div> : <div className="list-view">{filtered.map(item=><Link key={item.id} to={`/items/${item.id}`}><img src={item.photos[0]}/><div><strong>{item.name}</strong><span>{item.brand} {item.series ? `· ${item.series}` : ''}</span></div><span>{label(item.category)}</span><span>{label(item.status)}</span></Link>)}</div>}
  </section>;
}
