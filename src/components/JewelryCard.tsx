import { Link } from 'react-router-dom';
import { Gem, Heart, Sparkles } from 'lucide-react';
import { JewelryItem } from '../types/jewelry';
import { useI18n } from '../i18n';

export function JewelryCard({item}:{item:JewelryItem}){
  const {t,label}=useI18n();
  const value = item.referencePrice || item.purchasePrice;
  return <Link className="jewel-card" to={`/items/${item.id}`}>
    <div className="photo jewel-photo">
      {item.photos[0] ? <img src={item.photos[0]} /> : <span className="card-placeholder"><Gem size={34}/><small>Jewelry</small></span>}
      <div className="card-spark" aria-hidden="true"><Sparkles size={16}/></div>
      <div className="card-cover-meta"><em><Gem size={12}/>{label(item.category)}</em><strong><Heart size={12}/>{item.status ? label(item.status) : t('notRecorded')}</strong></div>
    </div>
    <div className="card-body jewel-card-body">
      <div className="card-title-row"><strong>{item.name}</strong>{item.brand && <span>{item.brand}</span>}</div>
      <p>{[item.series,item.metalColor].filter(Boolean).join(' · ') || item.materials.map(label).join(' / ') || label(item.category)}</p>
      <div className="card-metrics">
        <span>{t('wearCount',{count:item.wearCount})}</span>
        <span>{value ? `$${value.toLocaleString()}` : t('notRecorded')}</span>
      </div>
    </div>
  </Link>
}
