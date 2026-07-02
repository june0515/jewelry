import { Link } from 'react-router-dom';
import { JewelryItem } from '../types/jewelry';

export function JewelryCard({item}:{item:JewelryItem}){
  return <Link className="jewel-card" to={`/items/${item.id}`}>
    <div className="photo">{item.photos[0] ? <img src={item.photos[0]} /> : <span>💎</span>}</div>
    <div className="card-body"><strong>{item.name}</strong><p>{item.brand || item.category}</p><div className="chips"><span>{item.category}</span><span>{item.status}</span></div><small>佩戴 {item.wearCount} 次 · {item.lastWornDate || '未记录'}</small></div>
  </Link>
}
