import { useLiveQuery } from 'dexie-react-hooks';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { db } from '../db/db';
import { today } from '../utils/date';

export function DetailPage(){
  const {id}=useParams(); const nav=useNavigate();
  const item = useLiveQuery(()=> id ? db.jewelry.get(id) : undefined, [id]);
  if(!item) return <div className="empty">找不到这件首饰</div>;
  async function wear(){ await db.jewelry.update(item!.id,{wearCount:item!.wearCount+1,lastWornDate:today(),updatedAt:new Date().toISOString()}); }
  async function remove(){ if(confirm('确定删除吗？')){ await db.jewelry.delete(item!.id); nav('/items'); } }
  return <section className="detail">
    <div className="gallery">{item.photos.length ? item.photos.map((p,i)=><img key={i} src={p}/>) : <div className="placeholder">💍</div>}</div>
    <div className="detail-card"><h1>{item.name}</h1><p>{item.brand}</p><div className="chips"><span>{item.category}</span><span>{item.status}</span>{item.materials.map(m=><span key={m}>{m}</span>)}</div>
    <dl><dt>佩戴次数</dt><dd>{item.wearCount}</dd><dt>最近佩戴</dt><dd>{item.lastWornDate || '未记录'}</dd><dt>颜色</dt><dd>{item.colors.join(' / ') || '-'}</dd><dt>场合</dt><dd>{item.occasions.join(' / ') || '-'}</dd><dt>购入</dt><dd>{item.purchaseDate || '-'} {item.purchasePrice ? ` · $${item.purchasePrice}` : ''}</dd><dt>渠道</dt><dd>{item.purchaseSource || '-'}</dd><dt>收纳位置</dt><dd>{item.storageLocation || '-'}</dd><dt>备注</dt><dd>{item.note || '-'}</dd></dl>
    <div className="actions"><button className="primary" onClick={wear}>今天戴了它</button><Link className="ghost" to={`/items/${item.id}/edit`}>编辑</Link><button className="danger" onClick={remove}>删除</button></div></div>
  </section>
}
