import { useLiveQuery } from 'dexie-react-hooks';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { db } from '../db/db';
import { today } from '../utils/date';
import { deleteJewelryFromCloud, saveJewelryToCloud } from '../utils/cloudSync';
import { useI18n } from '../i18n';
import { JewelryItem } from '../types/jewelry';

function sourceUrl(url: string) {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

function materialSourceKey(source: JewelryItem['materialSource']) {
  if (source === 'official') return 'materialSourceOfficial';
  if (source === 'ai_visual') return 'materialSourceAi';
  if (source === 'manual') return 'materialSourceManual';
  return 'materialSourceUnverified';
}

export function DetailPage(){
  const {t,label}=useI18n();
  const {id}=useParams();
  const nav=useNavigate();
  const item = useLiveQuery(()=> id ? db.jewelry.get(id) : undefined, [id]);
  if(!item) return <div className="empty">{t('missingItem')}</div>;
  const current = item;
  const costPerWear = current.purchasePrice && current.wearCount ? current.purchasePrice / current.wearCount : undefined;
  const valueChange = current.purchasePrice && current.referencePrice ? ((current.referencePrice - current.purchasePrice) / current.purchasePrice) * 100 : undefined;

  async function wear(){
    const wornDate = today();
    const updated = {...current, wearCount:current.wearCount+1, lastWornDate:wornDate, updatedAt:new Date().toISOString()};
    await db.transaction('rw', db.jewelry, db.wearEvents, async () => {
      await db.jewelry.put(updated);
      await db.wearEvents.add({id:crypto.randomUUID(),jewelryId:current.id,jewelryName:current.name,brand:current.brand,wornDate,createdAt:new Date().toISOString()});
    });
    try {
      await saveJewelryToCloud(updated);
    } catch {
      alert(t('cloudSyncFailed'));
    }
  }

  async function remove(){
    if(confirm(t('deleteConfirm'))){
      await db.transaction('rw', db.jewelry, db.wearEvents, async () => {
        await db.jewelry.delete(current.id);
        await db.wearEvents.where('jewelryId').equals(current.id).delete();
      });
      try {
        await deleteJewelryFromCloud(current.id);
      } catch {
        alert(t('cloudSyncFailed'));
      }
      nav('/items');
    }
  }

  return <section className="detail detail-luxury">
    <div className="gallery luxury-gallery">{item.photos.length ? item.photos.map((p,i)=><img key={i} src={p}/>) : <div className="placeholder">Jewelry</div>}</div>
    <div className="detail-card passport-card"><div className="passport-head"><div><div className="detail-kicker">{item.brand || label(item.category)}</div><h1>{item.name}</h1><p>{item.series}</p></div><span>{label(item.category)}</span></div><div className="chips"><span>{label(item.status)}</span>{item.materials.map(m=><span key={m}>{label(m)}</span>)}</div>
    <div className="value-strip"><div><span>{t('price')}</span><strong>{item.purchasePrice ? `$${item.purchasePrice.toLocaleString()}` : t('none')}</strong></div><div><span>{t('marketValue')}</span><strong>{item.referencePrice ? `$${item.referencePrice.toLocaleString()}` : t('none')}</strong></div><div><span>{t('costPerWear')}</span><strong>{costPerWear ? `$${costPerWear.toFixed(2)}` : t('none')}</strong></div></div>
    <h2>{t('jewelryPassport')}</h2>
    <dl className="passport-list">
      <dt>{t('series')}</dt><dd>{item.series || t('none')}</dd>
      <dt>{t('mainStone')}</dt><dd>{item.mainStone || t('none')}</dd>
      <dt>{t('materials')}</dt><dd>{item.materials.map(label).join(' / ') || t('none')}</dd>
      <dt>{t('materialSource')}</dt><dd>{t(materialSourceKey(item.materialSource))}{item.materialSourceUrl ? <> · <a className="detail-link" href={sourceUrl(item.materialSourceUrl)} target="_blank" rel="noreferrer">{t('viewSource')}</a></> : ''}</dd>
      <dt>{t('officialMaterialDescription')}</dt><dd>{item.materialDescription || t('none')}</dd>
      <dt>{t('metalColor')}</dt><dd>{item.metalColor || t('none')}</dd>
      <dt>{t('size')}</dt><dd>{item.size || t('none')}</dd>
      <dt>{t('colors')}</dt><dd>{item.colors.join(' / ') || t('none')}</dd>
      <dt>{t('purchaseInfo')}</dt><dd>{item.purchaseDate || t('none')} {item.purchaseSource ? ` · ${item.purchaseSource}` : ''}</dd>
      <dt>{t('reference')}</dt><dd>{item.referenceUrl ? <a className="detail-link" href={sourceUrl(item.referenceUrl)} target="_blank" rel="noreferrer">{t('viewSource')}</a> : t('none')}</dd>
      <dt>{t('storageLocation')}</dt><dd>{[item.storageLocation,item.boxName,item.trayLevel,item.compartment].filter(Boolean).join(' / ') || t('none')}</dd>
    </dl>
    <h2>{t('wearStats')}</h2>
    <dl className="passport-list">
      <dt>{t('wornTimes')}</dt><dd>{item.wearCount}</dd>
      <dt>{t('lastWorn')}</dt><dd>{item.lastWornDate || t('notRecorded')}</dd>
      <dt>{t('valueChange')}</dt><dd>{valueChange ? `${valueChange > 0 ? '+' : ''}${valueChange.toFixed(1)}%` : t('none')}</dd>
    </dl>
    <h2>{t('careRecord')}</h2>
    <dl className="passport-list">
      <dt>{t('care')}</dt><dd>{[item.lastCleanedDate && `${t('lastCleanedDate')}: ${item.lastCleanedDate}`, item.nextCareDate && `${t('nextCareDate')}: ${item.nextCareDate}`, item.needsPolish && t('needsPolish'), item.needsRepair && t('needsRepair')].filter(Boolean).join(' / ') || t('none')}</dd>
      <dt>{t('note')}</dt><dd>{item.note || t('none')}</dd>
    </dl>
    <div className="document-strip">{(item.invoicePhotos||[]).length > 0 && <span>{t('invoiceUpload')}: {(item.invoicePhotos||[]).length}</span>}{(item.certificatePhotos||[]).length > 0 && <span>{t('certificateUpload')}: {(item.certificatePhotos||[]).length}</span>}</div>
    <div className="actions"><button className="primary" onClick={wear}>{t('wornToday')}</button><Link className="ghost" to={`/items/${item.id}/edit`}>{t('edit')}</Link><button className="danger" onClick={remove}>{t('delete')}</button></div></div>
  </section>;
}
