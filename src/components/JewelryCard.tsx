import { Link } from 'react-router-dom';
import { JewelryItem } from '../types/jewelry';
import { useI18n } from '../i18n';

export function JewelryCard({item}:{item:JewelryItem}){
  const {t,label}=useI18n();
  return <Link className="jewel-card" to={`/items/${item.id}`}>
    <div className="photo">{item.photos[0] ? <img src={item.photos[0]} /> : <span>Jewelry</span>}</div>
    <div className="card-body"><strong>{item.name}</strong><p>{[item.brand,item.series].filter(Boolean).join(' · ') || label(item.category)}</p><div className="chips"><span>{label(item.category)}</span><span>{label(item.status)}</span></div><small>{item.createdAt ? item.createdAt.slice(0,10) : t('notRecorded')} · {t('wearCount',{count:item.wearCount})}</small></div>
  </Link>
}
