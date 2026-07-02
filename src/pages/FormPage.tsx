import { FormEvent, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { db } from '../db/db';
import { JewelryCategory, JewelryItem, JewelryMaterial, JewelryOccasion, JewelryStatus } from '../types/jewelry';
import { ImageUploader } from '../components/ImageUploader';

const categories: JewelryCategory[] = ['项链','耳环','戒指','手链','手表','胸针','脚链','其他'];
const materials: JewelryMaterial[] = ['925银','18K金','14K金','铂金','珍珠','钻石','天然石','合金','玫瑰金','其他'];
const occasions: JewelryOccasion[] = ['日常','通勤','正式','约会','派对','旅行'];
const statuses: JewelryStatus[] = ['常戴','收藏','需保养','已遗失','想转卖'];
const empty: JewelryItem = {id:'',photos:[],name:'',brand:'',category:'项链',materials:[],colors:[],occasions:[],wearCount:0,status:'常戴',createdAt:'',updatedAt:''};

function toggle<T>(arr:T[], v:T){ return arr.includes(v) ? arr.filter(x=>x!==v) : [...arr, v]; }

export function FormPage(){
  const {id}=useParams(); const nav=useNavigate(); const [item,setItem]=useState<JewelryItem>(empty);
  useEffect(()=>{ if(id) db.jewelry.get(id).then(v=>v&&setItem(v)); },[id]);
  async function submit(e:FormEvent){ e.preventDefault(); if(!item.name.trim()) return alert('请填写名称');
    const now = new Date().toISOString(); const saved = {...item, id:item.id || crypto.randomUUID(), createdAt:item.createdAt || now, updatedAt:now};
    await db.jewelry.put(saved); nav(`/items/${saved.id}`);
  }
  return <form className="form" onSubmit={submit}><h1>{id?'编辑首饰':'添加首饰'}</h1><ImageUploader photos={item.photos} onChange={photos=>setItem({...item,photos})}/>
  <label>名称<input value={item.name} onChange={e=>setItem({...item,name:e.target.value})} placeholder="如 Van Cleef 四叶草项链"/></label>
  <label>品牌<input value={item.brand||''} onChange={e=>setItem({...item,brand:e.target.value})} placeholder="Cartier / Tiffany / Chanel..."/></label>
  <div className="row"><label>分类<select value={item.category} onChange={e=>setItem({...item,category:e.target.value as JewelryCategory})}>{categories.map(c=><option key={c}>{c}</option>)}</select></label><label>状态<select value={item.status} onChange={e=>setItem({...item,status:e.target.value as JewelryStatus})}>{statuses.map(s=><option key={s}>{s}</option>)}</select></label></div>
  <div><p>材质</p><div className="pills">{materials.map(m=><button type="button" className={item.materials.includes(m)?'on':''} onClick={()=>setItem({...item,materials:toggle(item.materials,m)})} key={m}>{m}</button>)}</div></div>
  <div><p>佩戴场合</p><div className="pills">{occasions.map(o=><button type="button" className={item.occasions.includes(o)?'on':''} onClick={()=>setItem({...item,occasions:toggle(item.occasions,o)})} key={o}>{o}</button>)}</div></div>
  <label>颜色<input value={item.colors.join(', ')} onChange={e=>setItem({...item,colors:e.target.value.split(',').map(x=>x.trim()).filter(Boolean)})} placeholder="金色, 银色, 珍珠白"/></label>
  <div className="row"><label>购入日期<input type="date" value={item.purchaseDate||''} onChange={e=>setItem({...item,purchaseDate:e.target.value})}/></label><label>价格<input type="number" value={item.purchasePrice||''} onChange={e=>setItem({...item,purchasePrice:Number(e.target.value)||undefined})}/></label></div>
  <label>购入渠道<input value={item.purchaseSource||''} onChange={e=>setItem({...item,purchaseSource:e.target.value})}/></label><label>收纳位置<input value={item.storageLocation||''} onChange={e=>setItem({...item,storageLocation:e.target.value})}/></label><label>备注<textarea value={item.note||''} onChange={e=>setItem({...item,note:e.target.value})}/></label><button className="primary" type="submit">保存</button></form>
}
