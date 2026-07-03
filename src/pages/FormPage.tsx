import { FormEvent, ReactNode, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { db } from '../db/db';
import { JewelryCategory, JewelryItem, JewelryMaterial, JewelryOccasion, JewelryStatus } from '../types/jewelry';
import { brandOptions, getBrandSeries } from '../data/brandData';
import { ImageUploader } from '../components/ImageUploader';
import { recognizeJewelry } from '../utils/aiJewelryRecognition';
import { useI18n } from '../i18n';

const categories: JewelryCategory[] = ['项链','耳环','戒指','手链','手表','胸针','脚链','其他'];
const materials: JewelryMaterial[] = ['925银','18K金','14K金','铂金','珍珠','钻石','天然石','合金','玫瑰金','其他'];
const occasions: JewelryOccasion[] = ['日常','通勤','正式','约会','派对','旅行'];
const statuses: JewelryStatus[] = ['常戴','收藏','需保养','已遗失','想转卖'];
const stones = ['钻石','珍珠','Mother of Pearl','玛瑙','翡翠','红宝石','蓝宝石','祖母绿','水晶','无主石','其他'];
const metalColors = ['Yellow Gold','Rose Gold','White Gold','Silver','Platinum','Black','Two-tone','其他'];
const purchaseSources = ['官网','品牌门店','百货专柜','买手店','电商平台','二手平台','旅行购买','礼物','传家/继承','其他'];
const storageLocations = ['首饰盒','抽屉','梳妆台','保险柜','旅行收纳包','防尘袋','展示架','日常托盘','其他'];

const empty: JewelryItem = {
  id:'',
  photos:[],
  invoicePhotos:[],
  certificatePhotos:[],
  name:'',
  brand:'',
  series:'',
  category:'项链',
  materials:[],
  colors:[],
  occasions:[],
  wearCount:0,
  status:'常戴',
  createdAt:'',
  updatedAt:''
};

function toggle<T>(arr:T[], v:T){ return arr.includes(v) ? arr.filter(x=>x!==v) : [...arr, v]; }

function SelectWithCustom({labelText,value,options,placeholder,onChange}:{labelText:string;value:string;options:string[];placeholder?:string;onChange:(value:string)=>void;}){
  const isCustom = value && !options.includes(value);
  return <label>{labelText}<select value={isCustom?'__custom':value} onChange={e=>onChange(e.target.value === '__custom' ? value : e.target.value)}><option value="">{placeholder || labelText}</option>{options.map(option=><option key={option} value={option}>{option}</option>)}{isCustom && <option value="__custom">{value}</option>}</select><input className="custom-select-input" value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder || labelText}/></label>;
}

function MultiSelectDropdown<T extends string>({labelText,values,options,format,onChange}:{labelText:string;values:T[];options:T[];format:(value:T)=>string;onChange:(values:T[])=>void;}){
  return <details className="dropdown-field"><summary><span>{labelText}</span><strong>{values.length ? values.map(format).join(' / ') : '-'}</strong></summary><div className="dropdown-menu">{options.map(option=><label className="check-option" key={option}><input type="checkbox" checked={values.includes(option)} onChange={()=>onChange(toggle(values, option))}/><span>{format(option)}</span></label>)}</div></details>;
}

function FormSection({title,children}:{title:string;children:ReactNode}) {
  return <section className="form-section"><h2>{title}</h2>{children}</section>;
}

export function FormPage(){
  const {t,label}=useI18n();
  const {id}=useParams();
  const nav=useNavigate();
  const [item,setItem]=useState<JewelryItem>(empty);
  const [brandQuery,setBrandQuery]=useState('');
  const [recognizing,setRecognizing]=useState(false);
  const [aiError,setAiError]=useState('');

  useEffect(()=>{ if(id) db.jewelry.get(id).then(v=>v&&setItem({...empty,...v})); },[id]);

  const filteredBrands = useMemo(() => {
    const q = brandQuery.trim().toLowerCase();
    return brandOptions.filter(brand => !q || brand.name.toLowerCase().includes(q)).slice(0, 12);
  }, [brandQuery]);

  const seriesOptions = useMemo(() => getBrandSeries(item.brand), [item.brand]);

  async function submit(e:FormEvent){
    e.preventDefault();
    if(!item.name.trim()) return alert(t('missingName'));
    const now = new Date().toISOString();
    const saved = {...item, id:item.id || crypto.randomUUID(), createdAt:item.createdAt || now, updatedAt:now};
    await db.jewelry.put(saved);
    nav(`/items/${saved.id}`);
  }

  async function identify(){
    const photo = item.photos[0];
    if(!photo) return;
    setRecognizing(true);
    setAiError('');
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

  return <form className="form collection-form" onSubmit={submit}>
    <div className="form-heading"><span>{t('luxuryManager')}</span><h1>{id?t('editJewelry'):t('addJewelry')}</h1></div>
    <FormSection title={t('basicInfo')}>
      <ImageUploader photos={item.photos} onChange={photos=>setItem({...item,photos})}/>
      <div className="ai-panel"><div><strong>{t('aiTitle')}</strong><span>{t('aiBody')}</span></div><button type="button" className="ghost" disabled={!item.photos.length || recognizing} onClick={identify}>{recognizing?t('recognizing'):t('aiIdentify')}</button></div>
      {aiError && <div className="form-error">{aiError}</div>}
      <label>{t('name')}<input value={item.name} onChange={e=>setItem({...item,name:e.target.value})} placeholder={t('namePlaceholder')}/></label>
      <div className="brand-picker">
        <label>{t('brandSearch')}<input value={brandQuery} onChange={e=>setBrandQuery(e.target.value)} placeholder="Cartier / Van Cleef / Tiffany..."/></label>
        <div className="brand-grid">{filteredBrands.map(brand=><button type="button" key={brand.name} className={item.brand===brand.name?'on':''} onClick={()=>setItem({...item,brand:brand.name,series:''})}><span>{brand.logo}</span>{brand.name}</button>)}</div>
        <input value={item.brand || ''} onChange={e=>setItem({...item,brand:e.target.value})} placeholder={t('customBrand')}/>
      </div>
      <div className="row"><SelectWithCustom labelText={t('series')} value={item.series||''} options={seriesOptions} placeholder={t('series')} onChange={series=>setItem({...item,series})}/><label>{t('category')}<select value={item.category} onChange={e=>setItem({...item,category:e.target.value as JewelryCategory})}>{categories.map(c=><option key={c} value={c}>{label(c)}</option>)}</select></label></div>
      <label>{t('status')}<select value={item.status} onChange={e=>setItem({...item,status:e.target.value as JewelryStatus})}>{statuses.map(s=><option key={s} value={s}>{label(s)}</option>)}</select></label>
    </FormSection>

    <FormSection title={t('jewelryInfo')}>
      <MultiSelectDropdown labelText={t('materials')} values={item.materials} options={materials} format={label} onChange={nextMaterials=>setItem({...item,materials:nextMaterials})}/>
      <div className="row"><SelectWithCustom labelText={t('mainStone')} value={item.mainStone||''} options={stones} onChange={mainStone=>setItem({...item,mainStone})}/><SelectWithCustom labelText={t('metalColor')} value={item.metalColor||''} options={metalColors} onChange={metalColor=>setItem({...item,metalColor})}/></div>
      <div className="row"><label>{t('size')}<input value={item.size||''} onChange={e=>setItem({...item,size:e.target.value})} placeholder="42cm / US 6 / 16mm"/></label><label>{t('weight')}<input type="number" value={item.weight||''} onChange={e=>setItem({...item,weight:Number(e.target.value)||undefined})}/></label></div>
      <MultiSelectDropdown labelText={t('colors')} values={item.colors} options={['金色','银色','玫瑰金','珍珠白','白色','黑色','红色','粉色','蓝色','绿色','紫色','透明','彩色','其他']} format={value=>value} onChange={nextColors=>setItem({...item,colors:nextColors})}/>
      <MultiSelectDropdown labelText={t('occasions')} values={item.occasions} options={occasions} format={label} onChange={nextOccasions=>setItem({...item,occasions:nextOccasions})}/>
    </FormSection>

    <FormSection title={t('purchaseInfo')}>
      <div className="row"><label>{t('purchaseDate')}<input type="date" value={item.purchaseDate||''} onChange={e=>setItem({...item,purchaseDate:e.target.value})}/></label><label>{t('price')}<input type="number" value={item.purchasePrice||''} onChange={e=>setItem({...item,purchasePrice:Number(e.target.value)||undefined})}/></label></div>
      <div className="row"><label>{t('referencePrice')}<input type="number" value={item.referencePrice||''} onChange={e=>setItem({...item,referencePrice:Number(e.target.value)||undefined})}/></label><label>{t('referenceUrl')}<input value={item.referenceUrl||''} onChange={e=>setItem({...item,referenceUrl:e.target.value})} placeholder="https://..."/></label></div>
      <SelectWithCustom labelText={t('purchaseSource')} value={item.purchaseSource||''} options={purchaseSources} onChange={purchaseSource=>setItem({...item,purchaseSource})}/>
      <div className="row"><div><p>{t('invoiceUpload')}</p><ImageUploader photos={item.invoicePhotos||[]} onChange={invoicePhotos=>setItem({...item,invoicePhotos})}/></div><div><p>{t('certificateUpload')}</p><ImageUploader photos={item.certificatePhotos||[]} onChange={certificatePhotos=>setItem({...item,certificatePhotos})}/></div></div>
    </FormSection>

    <FormSection title={t('storageInfo')}>
      <SelectWithCustom labelText={t('storageLocation')} value={item.storageLocation||''} options={storageLocations} onChange={storageLocation=>setItem({...item,storageLocation})}/>
      <div className="row"><label>{t('boxName')}<input value={item.boxName||''} onChange={e=>setItem({...item,boxName:e.target.value})} placeholder="Jewelry Box A"/></label><label>{t('trayLevel')}<input value={item.trayLevel||''} onChange={e=>setItem({...item,trayLevel:e.target.value})} placeholder="第一层"/></label></div>
      <div className="row"><label>{t('compartment')}<input value={item.compartment||''} onChange={e=>setItem({...item,compartment:e.target.value})} placeholder="第二格"/></label><label className="switch-row"><input type="checkbox" checked={!!item.travelCase} onChange={e=>setItem({...item,travelCase:e.target.checked})}/>{t('travelCase')}</label></div>
    </FormSection>

    <FormSection title={t('care')}>
      <div className="row"><label>{t('lastCleanedDate')}<input type="date" value={item.lastCleanedDate||''} onChange={e=>setItem({...item,lastCleanedDate:e.target.value})}/></label><label>{t('nextCareDate')}<input type="date" value={item.nextCareDate||''} onChange={e=>setItem({...item,nextCareDate:e.target.value})}/></label></div>
      <div className="toggle-line"><label><input type="checkbox" checked={!!item.needsPolish} onChange={e=>setItem({...item,needsPolish:e.target.checked})}/>{t('needsPolish')}</label><label><input type="checkbox" checked={!!item.needsRepair} onChange={e=>setItem({...item,needsRepair:e.target.checked})}/>{t('needsRepair')}</label></div>
    </FormSection>

    <FormSection title={t('note')}>
      <textarea value={item.note||''} onChange={e=>setItem({...item,note:e.target.value})}/>
    </FormSection>
    <button className="primary form-save" type="submit">{t('save')}</button>
  </form>;
}
