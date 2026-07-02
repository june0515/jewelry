import { FormEvent, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { db } from '../db/db';
import { JewelryCategory, JewelryItem, JewelryMaterial, JewelryOccasion, JewelryStatus } from '../types/jewelry';
import { ImageUploader } from '../components/ImageUploader';
import { recognizeJewelry } from '../utils/aiJewelryRecognition';
import { useI18n } from '../i18n';

const categories: JewelryCategory[] = ['项链','耳环','戒指','手链','手表','胸针','脚链','其他'];
const materials: JewelryMaterial[] = ['925银','18K金','14K金','铂金','珍珠','钻石','天然石','合金','玫瑰金','其他'];
const occasions: JewelryOccasion[] = ['日常','通勤','正式','约会','派对','旅行'];
const statuses: JewelryStatus[] = ['常戴','收藏','需保养','已遗失','想转卖'];
const empty: JewelryItem = {id:'',photos:[],name:'',brand:'',category:'项链',materials:[],colors:[],occasions:[],wearCount:0,status:'常戴',createdAt:'',updatedAt:''};

function toggle<T>(arr:T[], v:T){ return arr.includes(v) ? arr.filter(x=>x!==v) : [...arr, v]; }

export function FormPage(){
  const {t,label}=useI18n();
  const {id}=useParams(); const nav=useNavigate(); const [item,setItem]=useState<JewelryItem>(empty);
  const [recognizing,setRecognizing]=useState(false);
  const [aiError,setAiError]=useState('');
  useEffect(()=>{ if(id) db.jewelry.get(id).then(v=>v&&setItem(v)); },[id]);
  async function submit(e:FormEvent){ e.preventDefault(); if(!item.name.trim()) return alert(t('missingName'));
    const now = new Date().toISOString(); const saved = {...item, id:item.id || crypto.randomUUID(), createdAt:item.createdAt || now, updatedAt:now};
    await db.jewelry.put(saved); nav(`/items/${saved.id}`);
  }
  async function identify(){
    const photo = item.photos[0];
    if(!photo) return;
    setRecognizing(true); setAiError('');
    try{
      const result = await recognizeJewelry(photo);
      setItem(current=>({
        ...current,
        name: current.name || result.name || '',
        brand: current.brand || result.brand || '',
        category: result.category || current.category,
        materials: result.materials?.length ? result.materials : current.materials,
        colors: result.colors?.length ? result.colors : current.colors,
        occasions: result.occasions?.length ? result.occasions : current.occasions,
        status: result.status || current.status,
        note: [current.note, result.note].filter(Boolean).join(current.note && result.note ? '\n' : ''),
      }));
    }catch(error){
      setAiError(error instanceof Error ? error.message : t('aiFailed'));
    }finally{
      setRecognizing(false);
    }
  }
  return <form className="form" onSubmit={submit}><h1>{id?t('editJewelry'):t('addJewelry')}</h1><ImageUploader photos={item.photos} onChange={photos=>setItem({...item,photos})}/>
  <div className="ai-panel"><div><strong>{t('aiTitle')}</strong><span>{t('aiBody')}</span></div><button type="button" className="ghost" disabled={!item.photos.length || recognizing} onClick={identify}>{recognizing?t('recognizing'):t('aiIdentify')}</button></div>
  {aiError && <div className="form-error">{aiError}</div>}
  <label>{t('name')}<input value={item.name} onChange={e=>setItem({...item,name:e.target.value})} placeholder={t('namePlaceholder')}/></label>
  <label>{t('brand')}<input value={item.brand||''} onChange={e=>setItem({...item,brand:e.target.value})} placeholder="Cartier / Tiffany / Chanel..."/></label>
  <div className="row"><label>{t('category')}<select value={item.category} onChange={e=>setItem({...item,category:e.target.value as JewelryCategory})}>{categories.map(c=><option key={c} value={c}>{label(c)}</option>)}</select></label><label>{t('status')}<select value={item.status} onChange={e=>setItem({...item,status:e.target.value as JewelryStatus})}>{statuses.map(s=><option key={s} value={s}>{label(s)}</option>)}</select></label></div>
  <div><p>{t('materials')}</p><div className="pills">{materials.map(m=><button type="button" className={item.materials.includes(m)?'on':''} onClick={()=>setItem({...item,materials:toggle(item.materials,m)})} key={m}>{label(m)}</button>)}</div></div>
  <div><p>{t('occasions')}</p><div className="pills">{occasions.map(o=><button type="button" className={item.occasions.includes(o)?'on':''} onClick={()=>setItem({...item,occasions:toggle(item.occasions,o)})} key={o}>{label(o)}</button>)}</div></div>
  <label>{t('colors')}<input value={item.colors.join(', ')} onChange={e=>setItem({...item,colors:e.target.value.split(',').map(x=>x.trim()).filter(Boolean)})} placeholder={t('colorsPlaceholder')}/></label>
  <div className="row"><label>{t('purchaseDate')}<input type="date" value={item.purchaseDate||''} onChange={e=>setItem({...item,purchaseDate:e.target.value})}/></label><label>{t('price')}<input type="number" value={item.purchasePrice||''} onChange={e=>setItem({...item,purchasePrice:Number(e.target.value)||undefined})}/></label></div>
  <label>{t('purchaseSource')}<input value={item.purchaseSource||''} onChange={e=>setItem({...item,purchaseSource:e.target.value})}/></label><label>{t('storageLocation')}<input value={item.storageLocation||''} onChange={e=>setItem({...item,storageLocation:e.target.value})}/></label><label>{t('note')}<textarea value={item.note||''} onChange={e=>setItem({...item,note:e.target.value})}/></label><button className="primary" type="submit">{t('save')}</button></form>
}
