import { useLiveQuery } from 'dexie-react-hooks';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { db } from '../db/db';
import { today } from '../utils/date';
import { useI18n } from '../i18n';

function sourceUrl(url: string) {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

export function DetailPage(){
  const {t,label}=useI18n();
  const {id}=useParams(); const nav=useNavigate();
  const item = useLiveQuery(()=> id ? db.jewelry.get(id) : undefined, [id]);
  if(!item) return <div className="empty">{t('missingItem')}</div>;
  async function wear(){ await db.jewelry.update(item!.id,{wearCount:item!.wearCount+1,lastWornDate:today(),updatedAt:new Date().toISOString()}); }
  async function remove(){ if(confirm(t('deleteConfirm'))){ await db.jewelry.delete(item!.id); nav('/items'); } }
  return <section className="detail">
    <div className="gallery">{item.photos.length ? item.photos.map((p,i)=><img key={i} src={p}/>) : <div className="placeholder">💍</div>}</div>
    <div className="detail-card"><h1>{item.name}</h1><p>{item.brand}</p><div className="chips"><span>{label(item.category)}</span><span>{label(item.status)}</span>{item.materials.map(m=><span key={m}>{label(m)}</span>)}</div>
    <dl><dt>{t('wornTimes')}</dt><dd>{item.wearCount}</dd><dt>{t('lastWorn')}</dt><dd>{item.lastWornDate || t('notRecorded')}</dd><dt>{t('colors')}</dt><dd>{item.colors.join(' / ') || t('none')}</dd><dt>{t('occasions')}</dt><dd>{item.occasions.map(label).join(' / ') || t('none')}</dd><dt>{t('purchase')}</dt><dd>{item.purchaseDate || t('none')} {item.purchasePrice ? ` · $${item.purchasePrice}` : ''}</dd><dt>{t('reference')}</dt><dd>{item.referencePrice ? `$${item.referencePrice}` : t('none')} {item.referenceUrl ? <a className="detail-link" href={sourceUrl(item.referenceUrl)} target="_blank" rel="noreferrer">{t('viewSource')}</a> : ''}</dd><dt>{t('source')}</dt><dd>{item.purchaseSource || t('none')}</dd><dt>{t('storageLocation')}</dt><dd>{item.storageLocation || t('none')}</dd><dt>{t('note')}</dt><dd>{item.note || t('none')}</dd></dl>
    <div className="actions"><button className="primary" onClick={wear}>{t('wornToday')}</button><Link className="ghost" to={`/items/${item.id}/edit`}>{t('edit')}</Link><button className="danger" onClick={remove}>{t('delete')}</button></div></div>
  </section>
}
