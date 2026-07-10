import { Link } from 'react-router-dom';
import { JewelryItem } from '../types/jewelry';
import { useI18n } from '../i18n';

export function JewelryCard({item}:{item:JewelryItem}){
  const {t,label}=useI18n();
  const value = item.referencePrice || item.purchasePrice;
  return <Link className="jewel-card" to={`/items/${item.id}`}>
    <div className="photo jewel-photo">
      {item.photos[0] ? <img src={item.photos[0]} /> : <span>Jewelry</span>}
      <div className="card-cover-meta"><em>{label(item.category)}</em><strong>{item.status ? label(item.status) : t('notRecorded')}</strong></div>
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
