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
const brands = ['Cartier','Tiffany & Co.','Van Cleef & Arpels','Chanel','Dior','Bvlgari','Hermes','Pandora','Swarovski','周大福','周生生','六福珠宝','老铺黄金','其他'];
const colors = ['金色','银色','玫瑰金','珍珠白','白色','黑色','红色','粉色','蓝色','绿色','紫色','黄色','透明','彩色','其他'];
const purchaseSources = ['官网','品牌门店','百货专柜','买手店','电商平台','二手平台','旅行购买','礼物','传家/继承','其他'];
const storageLocations = ['首饰盒','抽屉','梳妆台','保险柜','旅行收纳包','防尘袋','展示架','日常托盘','其他'];
const empty: JewelryItem = {id:'',photos:[],name:'',brand:'',category:'项链',materials:[],colors:[],occasions:[],wearCount:0,status:'常戴',createdAt:'',updatedAt:''};

function toggle<T>(arr:T[], v:T){ return arr.includes(v) ? arr.filter(x=>x!==v) : [...arr, v]; }

function SelectWithCustom({labelText,value,options,placeholder,onChange}:{labelText:string;value:string;options:string[];placeholder?:string;onChange:(value:string)=>void;}){
  const isCustom = value && !options.includes(value);
  return <label>{labelText}<select value={isCustom?'__custom':value} onChange={e=>onChange(e.target.value === '__custom' ? value : e.target.value)}><option value="">{placeholder || labelText}</option>{options.map(option=><option key={option} value={option}>{option}</option>)}{isCustom && <option value="__custom">{value}</option>}</select><input className="custom-select-input" value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder || labelText}/></label>;
}

function MultiSelectDropdown<T extends string>({labelText,values,options,format,onChange}:{labelText:string;values:T[];options:T[];format:(value:T)=>string;onChange:(values:T[])=>void;}){
  return <details className="dropdown-field"><summary><span>{labelText}</span><strong>{values.length ? values.map(format).join(' / ') : '-'}</strong></summary><div className="dropdown-menu">{options.map(option=><label className="check-option" key={option}><input type="checkbox" checked={values.includes(option)} onChange={()=>onChange(toggle(values, option))}/><span>{format(option)}</span></label>)}</div></details>;
}

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
  <SelectWithCustom labelText={t('brand')} value={item.brand||''} options={brands} placeholder="Cartier / Tiffany / Chanel..." onChange={brand=>setItem({...item,brand})}/>
  <div className="row"><label>{t('category')}<select value={item.category} onChange={e=>setItem({...item,category:e.target.value as JewelryCategory})}>{categories.map(c=><option key={c} value={c}>{label(c)}</option>)}</select></label><label>{t('status')}<select value={item.status} onChange={e=>setItem({...item,status:e.target.value as JewelryStatus})}>{statuses.map(s=><option key={s} value={s}>{label(s)}</option>)}</select></label></div>
  <MultiSelectDropdown labelText={t('materials')} values={item.materials} options={materials} format={label} onChange={nextMaterials=>setItem({...item,materials:nextMaterials})}/>
  <MultiSelectDropdown labelText={t('occasions')} values={item.occasions} options={occasions} format={label} onChange={nextOccasions=>setItem({...item,occasions:nextOccasions})}/>
  <MultiSelectDropdown labelText={t('colors')} values={item.colors} options={colors} format={value=>value} onChange={nextColors=>setItem({...item,colors:nextColors})}/>
  <div className="row"><label>{t('purchaseDate')}<input type="date" value={item.purchaseDate||''} onChange={e=>setItem({...item,purchaseDate:e.target.value})}/></label><label>{t('price')}<input type="number" value={item.purchasePrice||''} onChange={e=>setItem({...item,purchasePrice:Number(e.target.value)||undefined})}/></label></div>
  <div className="row"><label>{t('referencePrice')}<input type="number" value={item.referencePrice||''} onChange={e=>setItem({...item,referencePrice:Number(e.target.value)||undefined})}/></label><label>{t('referenceUrl')}<input value={item.referenceUrl||''} onChange={e=>setItem({...item,referenceUrl:e.target.value})} placeholder="https://..."/></label></div>
  <SelectWithCustom labelText={t('purchaseSource')} value={item.purchaseSource||''} options={purchaseSources} onChange={purchaseSource=>setItem({...item,purchaseSource})}/>
  <SelectWithCustom labelText={t('storageLocation')} value={item.storageLocation||''} options={storageLocations} onChange={storageLocation=>setItem({...item,storageLocation})}/>
  <label>{t('note')}<textarea value={item.note||''} onChange={e=>setItem({...item,note:e.target.value})}/></label><button className="primary" type="submit">{t('save')}</button></form>
}
