import { FormEvent, ReactNode, useEffect, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useNavigate, useParams } from 'react-router-dom';
import { db } from '../db/db';
import { JewelryCategory, JewelryItem, JewelryMaterial, JewelryOccasion, JewelryStatus } from '../types/jewelry';
import { brandOptions, getBrandSeries } from '../data/brandData';
import { ImageUploader } from '../components/ImageUploader';
import { recognizeJewelry, JewelryRecognitionResult } from '../utils/aiJewelryRecognition';
import { enrichJewelryFromOfficialSource, OfficialJewelryEnrichmentResult } from '../utils/officialJewelryEnrichment';
import { saveJewelryToCloud } from '../utils/cloudSync';
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

const steps = ['basicInfo','jewelryInfo','purchaseInfo','managementInfo'] as const;

function toggle<T>(arr:T[], v:T){ return arr.includes(v) ? arr.filter(x=>x!==v) : [...arr, v]; }

function RequiredMark() {
  return <span className="required-mark">*</span>;
}

function SearchableCombobox({labelText,value,options,placeholder,onChange}:{labelText:string;value:string;options:string[];placeholder?:string;onChange:(value:string)=>void;}){
  const [query,setQuery]=useState(value);
  useEffect(()=>setQuery(value),[value]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return options.filter(option => !q || option.toLowerCase().includes(q)).slice(0, 8);
  }, [options, query]);
  const custom = query.trim() && !options.includes(query.trim());
  return <div className="combo-field">
    <label>{labelText}<input value={query} onChange={e=>{setQuery(e.target.value);onChange(e.target.value);}} placeholder={placeholder || labelText}/></label>
    <div className="combo-options">
      {filtered.map(option=><button type="button" key={option} className={value===option?'on':''} onClick={()=>{onChange(option);setQuery(option);}}>{option}</button>)}
      {custom && <button type="button" className="add-option" onClick={()=>onChange(query.trim())}>+ {query.trim()}</button>}
    </div>
  </div>;
}

function MultiSelectDropdown<T extends string>({labelText,values,options,format,onChange}:{labelText:string;values:T[];options:T[];format:(value:T)=>string;onChange:(values:T[])=>void;}){
  return <details className="dropdown-field"><summary><span>{labelText}</span><strong>{values.length ? values.map(format).join(' / ') : '-'}</strong></summary><div className="dropdown-menu">{options.map(option=><label className="check-option" key={option}><input type="checkbox" checked={values.includes(option)} onChange={()=>onChange(toggle(values, option))}/><span>{format(option)}</span></label>)}</div></details>;
}

function FormSection({title,children}:{title:string;children:ReactNode}) {
  return <section className="form-section step-card"><h2>{title}</h2>{children}</section>;
}

function formatAiError(message: string, fallback: string) {
  if (!message) return fallback;
  const lower = message.toLowerCase();
  const isEnglish = fallback.toLowerCase().startsWith('ai is');
  if (lower.includes('quota') || lower.includes('billing') || lower.includes('credit') || lower.includes('insufficient')) {
    return isEnglish ? `${fallback} API credits or billing are not available.` : `${fallback} 当前 API 额度或付款方式不可用。`;
  }
  if (lower.includes('model') || lower.includes('access') || lower.includes('permission')) {
    return isEnglish ? `${fallback} The API key may not have access to this model.` : `${fallback} 当前 API key 可能没有模型权限。`;
  }
  return `${fallback} ${message}`;
}

function formatOfficialError(message: string, fallback: string) {
  if (!message) return fallback;
  return `${fallback} ${message}`;
}

function editableAiResult(result: JewelryRecognitionResult): JewelryRecognitionResult {
  return {
    name: result.name || '',
    brand: result.brand || '',
    series: result.series || '',
    category: result.category || '其他',
    materials: result.materials || [],
    mainStone: result.mainStone || '',
    metalColor: result.metalColor || '',
  };
}

function isUnhelpfulAiResult(result: JewelryRecognitionResult) {
  const name = (result.name || '').trim();
  return !!result.weakResult || (
    (!name || name === '首饰') &&
    (!result.category || result.category === '其他') &&
    !(result.materials || []).length &&
    !result.mainStone &&
    !result.metalColor
  );
}

function sourceUrl(url: string) {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

function withOfficialMaterialNote(note: string | undefined, materialDescription: string | undefined, labelText: string) {
  const description = materialDescription?.trim();
  if (!description) return note || '';
  const block = `${labelText}: ${description}`;
  if ((note || '').includes(block)) return note || '';
  return [note, block].filter(Boolean).join('\n\n');
}

function materialSourceKey(source: JewelryItem['materialSource']) {
  if (source === 'official') return 'materialSourceOfficial';
  if (source === 'ai_visual') return 'materialSourceAi';
  if (source === 'manual') return 'materialSourceManual';
  return 'materialSourceUnverified';
}

function confidenceKey(confidence: OfficialJewelryEnrichmentResult['matchConfidence']) {
  if (confidence === 'high') return 'officialConfidence_high';
  if (confidence === 'medium') return 'officialConfidence_medium';
  return 'officialConfidence_low';
}

export function FormPage(){
  const {t,label}=useI18n();
  const {id}=useParams();
  const nav=useNavigate();
  const allItems = useLiveQuery(()=>db.jewelry.toArray(), []) || [];
  const [item,setItem]=useState<JewelryItem>(empty);
  const [activeStep,setActiveStep]=useState(0);
  const [brandQuery,setBrandQuery]=useState('');
  const [showAllBrands,setShowAllBrands]=useState(false);
  const [recognizingMode,setRecognizingMode]=useState<'fast' | 'precise' | ''>('');
  const [aiError,setAiError]=useState('');
  const [pendingAiResult,setPendingAiResult]=useState<JewelryRecognitionResult | null>(null);
  const [enriching,setEnriching]=useState(false);
  const [officialError,setOfficialError]=useState('');
  const [officialResult,setOfficialResult]=useState<OfficialJewelryEnrichmentResult | null>(null);
  const [touchedSubmit,setTouchedSubmit]=useState(false);

  useEffect(()=>{ if(id) db.jewelry.get(id).then(v=>v&&setItem({...empty,...v})); },[id]);

  const frequentBrands = useMemo(() => {
    const counts = allItems.reduce<Record<string, number>>((acc, current) => {
      if (current.brand) acc[current.brand] = (acc[current.brand] || 0) + 1;
      return acc;
    }, {});
    const names = Object.entries(counts).sort((a,b)=>b[1]-a[1]).map(([brand])=>brand);
    const fallback = ['Cartier','Van Cleef & Arpels','Tiffany & Co.','Chanel','Bvlgari'];
    return [...names, ...fallback].filter((brand, index, arr)=>arr.indexOf(brand)===index).slice(0,5);
  }, [allItems]);

  const visibleBrands = useMemo(() => {
    const q = brandQuery.trim().toLowerCase();
    const source = q || showAllBrands ? brandOptions.map(brand => brand.name) : frequentBrands;
    return source.filter(brand => !q || brand.toLowerCase().includes(q)).slice(0, showAllBrands || q ? 36 : 5);
  }, [brandQuery, frequentBrands, showAllBrands]);

  const seriesOptions = useMemo(() => getBrandSeries(item.brand), [item.brand]);
  const missingName = touchedSubmit && !item.name.trim();

  async function submit(e:FormEvent){
    e.preventDefault();
    setTouchedSubmit(true);
    if(!item.name.trim()) {
      setActiveStep(0);
      return;
    }
    const now = new Date().toISOString();
    const saved = {...item, id:item.id || crypto.randomUUID(), createdAt:item.createdAt || now, updatedAt:now};
    await db.jewelry.put(saved);
    try {
      await saveJewelryToCloud(saved);
    } catch {
      alert(t('cloudSyncFailed'));
    }
    nav(`/items/${saved.id}`);
  }

  async function runRecognition(photo: string, mode: 'fast' | 'precise' = 'fast'){
    if(!photo) return;
    setRecognizingMode(mode);
    setAiError('');
    try{
      const result = await recognizeJewelry(photo, mode);
      if (isUnhelpfulAiResult(result)) {
        setPendingAiResult(null);
        setAiError(mode === 'fast' ? t('aiFastUnhelpfulResult') : t('aiUnhelpfulResult'));
        return;
      }
      setPendingAiResult(editableAiResult(result));
    }catch(error){
      setAiError(formatAiError(error instanceof Error ? error.message : '', t('aiFailed')));
    }finally{
      setRecognizingMode('');
    }
  }

  function identify(mode: 'fast' | 'precise' = 'fast'){
    const photo = item.photos[0];
    if(photo) {
      setPendingAiResult(null);
      runRecognition(photo, mode);
    }
  }

  function updateAiResult(next: Partial<JewelryRecognitionResult>) {
    setPendingAiResult(current => current ? {...current, ...next} : current);
  }

  function applyRecognition(){
    if(!pendingAiResult) return;
    const result = pendingAiResult;
    setItem(current=>({
      ...current,
      name: current.name || result.name || '',
      brand: current.brand || result.brand || '',
      series: current.series || result.series || '',
      category: result.category || current.category,
      materials: result.materials?.length ? result.materials : current.materials,
      materialSource: result.materials?.length ? 'ai_visual' : current.materialSource,
      mainStone: current.mainStone || result.mainStone || '',
      metalColor: current.metalColor || result.metalColor || '',
    }));
    setPendingAiResult(null);
  }

  async function runOfficialEnrichment() {
    setEnriching(true);
    setOfficialError('');
    try {
      const source = pendingAiResult || item;
      const result = await enrichJewelryFromOfficialSource({
        image: item.photos[0],
        name: source.name || item.name,
        brand: source.brand || item.brand,
        series: source.series || item.series,
        category: source.category || item.category,
        materials: source.materials?.length ? source.materials : item.materials,
        mainStone: source.mainStone || item.mainStone,
        metalColor: source.metalColor || item.metalColor,
      });
      setOfficialResult(result);
    } catch (error) {
      setOfficialError(formatOfficialError(error instanceof Error ? error.message : '', t('officialLookupFailed')));
    } finally {
      setEnriching(false);
    }
  }

  function applyOfficialResult(useOfficialImage: boolean) {
    if (!officialResult) return;
    const imageUrl = officialResult.imageUrl?.trim();
    const nextPhotos = useOfficialImage && imageUrl
      ? [imageUrl, ...item.photos.filter(photo => photo !== imageUrl)]
      : item.photos;

    setItem(current => ({
      ...current,
      photos: nextPhotos,
      name: current.name || officialResult.productName || '',
      brand: current.brand || officialResult.brand || '',
      series: current.series || officialResult.series || '',
      referenceUrl: officialResult.productUrl || current.referenceUrl,
      referencePrice: officialResult.priceAmount || current.referencePrice,
      purchaseSource: current.purchaseSource || (officialResult.productUrl ? '官网' : current.purchaseSource),
      materials: officialResult.materials?.length ? officialResult.materials : current.materials,
      materialSource: officialResult.materials?.length || officialResult.materialDescription ? 'official' : current.materialSource,
      materialSourceUrl: officialResult.productUrl || current.materialSourceUrl,
      materialDescription: officialResult.materialDescription || current.materialDescription,
      note: withOfficialMaterialNote(current.note, officialResult.materialDescription, t('officialMaterialDescription')),
    }));
  }

  return <form className="form collection-form stepper-form" onSubmit={submit}>
    <div className="form-heading"><span>{t('luxuryManager')}</span><h1>{id?t('editJewelry'):t('addJewelry')}</h1></div>
    <div className="stepper-tabs">{steps.map((step,index)=><button type="button" key={step} className={activeStep===index?'on':''} onClick={()=>setActiveStep(index)}><span>{index+1}</span>{t(step)}</button>)}</div>

    {activeStep===0 && <FormSection title={t('basicInfo')}>
      <ImageUploader photos={item.photos} onChange={photos=>setItem({...item,photos})}/>
      <div className="ai-panel"><div><strong>{t('aiTitle')}</strong><span>{t('aiBody')}</span></div><div className="ai-button-group"><button type="button" className="ghost" disabled={!item.photos.length || !!recognizingMode} onClick={()=>identify('fast')}>{recognizingMode==='fast'?t('recognizing'):t('aiIdentifyFast')}</button><button type="button" className="primary" disabled={!item.photos.length || !!recognizingMode} onClick={()=>identify('precise')}>{recognizingMode==='precise'?t('recognizing'):t('aiIdentifyPrecise')}</button></div></div>
      {aiError && <div className="form-error">{aiError}</div>}
      {pendingAiResult && <div className="ai-suggestion ai-editor"><div><strong>{t('aiSuggestionTitle')}</strong><span>{t('aiSuggestionBody')}</span></div>
        <div className="ai-edit-grid">
          <label>{t('name')}<input value={pendingAiResult.name || ''} onChange={e=>updateAiResult({name:e.target.value})}/></label>
          <label>{t('brand')}<input value={pendingAiResult.brand || ''} onChange={e=>updateAiResult({brand:e.target.value})}/></label>
          <label>{t('series')}<input value={pendingAiResult.series || ''} onChange={e=>updateAiResult({series:e.target.value})}/></label>
          <label>{t('category')}<select value={pendingAiResult.category || '其他'} onChange={e=>updateAiResult({category:e.target.value as JewelryCategory})}>{categories.map(c=><option key={c} value={c}>{label(c)}</option>)}</select></label>
          <label>{t('mainStone')}<input value={pendingAiResult.mainStone || ''} onChange={e=>updateAiResult({mainStone:e.target.value})}/></label>
          <label>{t('metalColor')}<input value={pendingAiResult.metalColor || ''} onChange={e=>updateAiResult({metalColor:e.target.value})}/></label>
        </div>
        <MultiSelectDropdown labelText={t('materials')} values={(pendingAiResult.materials || []) as JewelryMaterial[]} options={materials} format={label} onChange={nextMaterials=>updateAiResult({materials:nextMaterials})}/>
        <small className="source-note">{t('materialSource')}: {t('materialSourceAi')}</small>
        <div className="ai-actions"><button type="button" className="primary" onClick={applyRecognition}>{t('applyAiSuggestion')}</button><button type="button" className="ghost" onClick={()=>setPendingAiResult(null)}>{t('dismissAiSuggestion')}</button></div>
      </div>}
      <div className="official-panel">
        <div>
          <strong>{t('officialLookupTitle')}</strong>
          <span>{t('officialLookupBody')}</span>
        </div>
        <button type="button" className="ghost" disabled={enriching || (!item.photos.length && !item.name && !pendingAiResult?.name)} onClick={runOfficialEnrichment}>{enriching?t('officialSearching'):t('officialLookup')}</button>
      </div>
      {officialError && <div className="form-error">{officialError}</div>}
      {officialResult && <div className="official-result">
        {officialResult.imageUrl && <img src={officialResult.imageUrl} alt={officialResult.productName || t('officialImage')}/>}
        <div className="official-result-body">
          <div className="official-result-heading">
            <strong>{officialResult.productName || t('officialNoMatch')}</strong>
            <span>{t('officialConfidence')}: {t(confidenceKey(officialResult.matchConfidence))}</span>
          </div>
          <dl>
            <dt>{t('brand')}</dt><dd>{officialResult.brand || t('none')}</dd>
            <dt>{t('series')}</dt><dd>{officialResult.series || t('none')}</dd>
            <dt>{t('referencePrice')}</dt><dd>{officialResult.priceText || (officialResult.priceAmount ? `$${officialResult.priceAmount.toLocaleString()}` : t('none'))}</dd>
            <dt>{t('materials')}</dt><dd>{officialResult.materialDescription || officialResult.materials?.join(' / ') || t('none')}</dd>
            <dt>{t('source')}</dt><dd>{officialResult.productUrl ? <a className="detail-link" href={sourceUrl(officialResult.productUrl)} target="_blank" rel="noreferrer">{officialResult.sourceTitle || t('viewSource')}</a> : t('none')}</dd>
          </dl>
          <div className="ai-actions">
            <button type="button" className="primary" onClick={()=>applyOfficialResult(false)}>{t('applyOfficialInfo')}</button>
            <button type="button" className="ghost" disabled={!officialResult.imageUrl} onClick={()=>applyOfficialResult(true)}>{t('useOfficialImage')}</button>
            <button type="button" className="ghost" onClick={()=>setOfficialResult(null)}>{t('dismissAiSuggestion')}</button>
          </div>
        </div>
      </div>}
      <label>{t('name')} <RequiredMark/><input value={item.name} onChange={e=>setItem({...item,name:e.target.value})} placeholder={t('namePlaceholder')} aria-invalid={missingName}/>{missingName && <small className="field-error">{t('missingName')}</small>}</label>
      <div className="brand-picker refined-brand-picker">
        <label>{t('brandSearch')}<input value={brandQuery} onChange={e=>setBrandQuery(e.target.value)} placeholder="Cartier / Van Cleef / Tiffany..."/></label>
        <div className="brand-grid">{visibleBrands.map(brand=><button type="button" key={brand} className={item.brand===brand?'on selected':''} onClick={()=>{setItem({...item,brand,series:''});setBrandQuery('');}}><span>{brandOptions.find(option=>option.name===brand)?.logo || brand.slice(0,2)}</span>{brand}</button>)}</div>
        <div className="brand-actions"><button type="button" className="ghost" onClick={()=>setShowAllBrands(value=>!value)}>{showAllBrands?t('showCommonBrands'):t('viewAllBrands')}</button><input value={item.brand || ''} onChange={e=>setItem({...item,brand:e.target.value,series:''})} placeholder={t('customBrand')}/></div>
      </div>
      <div className="row"><SearchableCombobox labelText={t('series')} value={item.series||''} options={seriesOptions} placeholder={item.brand ? t('seriesRecommendation') : t('series')} onChange={series=>setItem({...item,series})}/><label>{t('category')} <RequiredMark/><select value={item.category} onChange={e=>setItem({...item,category:e.target.value as JewelryCategory})}>{categories.map(c=><option key={c} value={c}>{label(c)}</option>)}</select></label></div>
      <label>{t('status')}<select value={item.status} onChange={e=>setItem({...item,status:e.target.value as JewelryStatus})}>{statuses.map(s=><option key={s} value={s}>{label(s)}</option>)}</select></label>
    </FormSection>}

    {activeStep===1 && <FormSection title={t('jewelryInfo')}>
      <MultiSelectDropdown labelText={t('materials')} values={item.materials} options={materials} format={label} onChange={nextMaterials=>setItem({...item,materials:nextMaterials,materialSource:'manual'})}/>
      <small className="source-note">{t('materialSource')}: {t(materialSourceKey(item.materialSource))}{item.materialSourceUrl && <> · <a className="detail-link" href={sourceUrl(item.materialSourceUrl)} target="_blank" rel="noreferrer">{t('viewSource')}</a></>}</small>
      {item.materialDescription && <div className="material-description">{item.materialDescription}</div>}
      <div className="row"><SearchableCombobox labelText={t('mainStone')} value={item.mainStone||''} options={stones} onChange={mainStone=>setItem({...item,mainStone})}/><SearchableCombobox labelText={t('metalColor')} value={item.metalColor||''} options={metalColors} onChange={metalColor=>setItem({...item,metalColor})}/></div>
      <div className="row"><label>{t('size')}<input value={item.size||''} onChange={e=>setItem({...item,size:e.target.value})} placeholder="42cm / US 6 / 16mm"/></label><label>{t('weight')}<input type="number" value={item.weight||''} onChange={e=>setItem({...item,weight:Number(e.target.value)||undefined})}/></label></div>
      <MultiSelectDropdown labelText={t('occasions')} values={item.occasions} options={occasions} format={label} onChange={nextOccasions=>setItem({...item,occasions:nextOccasions})}/>
    </FormSection>}

    {activeStep===2 && <FormSection title={t('purchaseInfo')}>
      <div className="row"><label>{t('purchaseDate')}<input type="date" value={item.purchaseDate||''} onChange={e=>setItem({...item,purchaseDate:e.target.value})}/></label><label>{t('price')}<input type="number" value={item.purchasePrice||''} onChange={e=>setItem({...item,purchasePrice:Number(e.target.value)||undefined})}/></label></div>
      <div className="row"><label>{t('referencePrice')}<input type="number" value={item.referencePrice||''} onChange={e=>setItem({...item,referencePrice:Number(e.target.value)||undefined})}/></label><label>{t('referenceUrl')}<input value={item.referenceUrl||''} onChange={e=>setItem({...item,referenceUrl:e.target.value})} placeholder="https://..."/></label></div>
      <SearchableCombobox labelText={t('purchaseSource')} value={item.purchaseSource||''} options={purchaseSources} onChange={purchaseSource=>setItem({...item,purchaseSource})}/>
      <details className="advanced-fields"><summary>{t('documents')}</summary><div className="row"><div><p>{t('invoiceUpload')}</p><ImageUploader photos={item.invoicePhotos||[]} onChange={invoicePhotos=>setItem({...item,invoicePhotos})}/></div><div><p>{t('certificateUpload')}</p><ImageUploader photos={item.certificatePhotos||[]} onChange={certificatePhotos=>setItem({...item,certificatePhotos})}/></div></div></details>
    </FormSection>}

    {activeStep===3 && <FormSection title={t('managementInfo')}>
      <SearchableCombobox labelText={t('storageLocation')} value={item.storageLocation||''} options={storageLocations} onChange={storageLocation=>setItem({...item,storageLocation})}/>
      <div className="row"><label>{t('lastCleanedDate')}<input type="date" value={item.lastCleanedDate||''} onChange={e=>setItem({...item,lastCleanedDate:e.target.value})}/></label><label>{t('nextCareDate')}<input type="date" value={item.nextCareDate||''} onChange={e=>setItem({...item,nextCareDate:e.target.value})}/></label></div>
      <label>{t('note')}<textarea value={item.note||''} onChange={e=>setItem({...item,note:e.target.value})}/></label>
      <details className="advanced-fields"><summary>{t('advancedManagement')}</summary><div className="row"><label>{t('boxName')}<input value={item.boxName||''} onChange={e=>setItem({...item,boxName:e.target.value})} placeholder="Jewelry Box A"/></label><label>{t('trayLevel')}<input value={item.trayLevel||''} onChange={e=>setItem({...item,trayLevel:e.target.value})} placeholder="第一层"/></label></div><div className="row"><label>{t('compartment')}<input value={item.compartment||''} onChange={e=>setItem({...item,compartment:e.target.value})} placeholder="第二格"/></label><label className="switch-row"><input type="checkbox" checked={!!item.travelCase} onChange={e=>setItem({...item,travelCase:e.target.checked})}/>{t('travelCase')}</label></div><div className="toggle-line"><label><input type="checkbox" checked={!!item.needsPolish} onChange={e=>setItem({...item,needsPolish:e.target.checked})}/>{t('needsPolish')}</label><label><input type="checkbox" checked={!!item.needsRepair} onChange={e=>setItem({...item,needsRepair:e.target.checked})}/>{t('needsRepair')}</label></div></details>
    </FormSection>}

    <div className="stepper-actions">
      <button type="button" className="ghost" disabled={activeStep===0} onClick={()=>setActiveStep(step=>Math.max(0,step-1))}>{t('previousStep')}</button>
      {activeStep<steps.length-1 ? <button type="button" className="primary" onClick={()=>setActiveStep(step=>Math.min(steps.length-1,step+1))}>{t('nextStep')}</button> : <button className="primary form-save" type="submit">{t('save')}</button>}
    </div>
  </form>;
}
