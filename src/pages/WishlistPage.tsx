import { FormEvent, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { ImageUploader } from '../components/ImageUploader';
import { WishlistItem } from '../types/jewelry';
import { saveJewelryToCloud } from '../utils/cloudSync';
import { useI18n } from '../i18n';

const emptyWishlist: WishlistItem = {id:'',name:'',brand:'',series:'',targetPrice:undefined,referenceUrl:'',photos:[],createdAt:'',updatedAt:''};

export function WishlistPage() {
  const { t } = useI18n();
  const items = useLiveQuery(() => db.wishlist.orderBy('createdAt').reverse().toArray(), []) || [];
  const [draft,setDraft] = useState<WishlistItem>(emptyWishlist);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!draft.name.trim()) return alert(t('missingName'));
    const now = new Date().toISOString();
    await db.wishlist.put({...draft,id:draft.id || crypto.randomUUID(),createdAt:draft.createdAt || now,updatedAt:now});
    setDraft(emptyWishlist);
  }

  async function convert(item: WishlistItem) {
    const now = new Date().toISOString();
    const id = crypto.randomUUID();
    const saved = {id,photos:item.photos,name:item.name,brand:item.brand,series:item.series,category:item.category || '其他',materials:[],colors:[],occasions:[],wearCount:0,status:'收藏' as const,referencePrice:item.targetPrice,referenceUrl:item.referenceUrl,note:item.note,createdAt:now,updatedAt:now};
    await db.transaction('rw', db.wishlist, db.jewelry, async () => {
      await db.jewelry.put(saved);
      await db.wishlist.delete(item.id);
    });
    try {
      await saveJewelryToCloud(saved);
    } catch {
      alert(t('cloudSyncFailed'));
    }
  }

  return <section>
    <div className="section-title"><h1>{t('wishlist')}</h1></div>
    <form className="quick-form" onSubmit={submit}>
      <ImageUploader photos={draft.photos} onChange={photos=>setDraft({...draft,photos})}/>
      <div className="row"><label>{t('name')}<input value={draft.name} onChange={e=>setDraft({...draft,name:e.target.value})}/></label><label>{t('brand')}<input value={draft.brand||''} onChange={e=>setDraft({...draft,brand:e.target.value})}/></label></div>
      <div className="row"><label>{t('series')}<input value={draft.series||''} onChange={e=>setDraft({...draft,series:e.target.value})}/></label><label>{t('targetPrice')}<input type="number" value={draft.targetPrice||''} onChange={e=>setDraft({...draft,targetPrice:Number(e.target.value)||undefined})}/></label></div>
      <label>{t('referenceUrl')}<input value={draft.referenceUrl||''} onChange={e=>setDraft({...draft,referenceUrl:e.target.value})} placeholder="https://..."/></label>
      <button className="primary" type="submit">{t('addWishlist')}</button>
    </form>
    <div className="wishlist-grid">{items.map(item=><div className="wishlist-card" key={item.id}><div className="photo">{item.photos[0]?<img src={item.photos[0]}/>:<span>♡</span>}</div><strong>{item.name}</strong><p>{item.brand} {item.series}</p><span>{item.targetPrice ? `$${item.targetPrice.toLocaleString()}` : t('none')}</span><button className="ghost" onClick={()=>convert(item)}>{t('convertToCollection')}</button></div>)}</div>
  </section>;
}
