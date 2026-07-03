import { useLiveQuery } from 'dexie-react-hooks';
import { Link } from 'react-router-dom';
import { db } from '../db/db';
import { useI18n } from '../i18n';

function groupByDate<T extends { wornDate: string }>(events: T[]) {
  return events.reduce<Record<string, T[]>>((groups, event) => {
    groups[event.wornDate] = groups[event.wornDate] || [];
    groups[event.wornDate].push(event);
    return groups;
  }, {});
}

export function WearHistoryPage() {
  const { t } = useI18n();
  const events = useLiveQuery(() => db.wearEvents.orderBy('wornDate').reverse().toArray(), []) || [];
  const grouped = groupByDate(events);
  const mostWorn = Object.entries(events.reduce<Record<string, number>>((acc, event) => {
    acc[event.jewelryName] = (acc[event.jewelryName] || 0) + 1;
    return acc;
  }, {})).sort((a,b)=>b[1]-a[1])[0];

  return <section>
    <div className="section-title"><h1>{t('wearHistory')}</h1><div className="stat-pill">{t('mostWorn')}: {mostWorn ? `${mostWorn[0]} · ${mostWorn[1]}` : t('none')}</div></div>
    <div className="timeline">{Object.keys(grouped).length ? Object.entries(grouped).map(([date, dayEvents])=><div key={date} className="timeline-day"><h2>{date}</h2>{dayEvents.map(event=><Link key={event.id} to={`/items/${event.jewelryId}`}><strong>{event.jewelryName}</strong><span>{event.brand || ''}</span></Link>)}</div>) : <div className="empty">{t('noWearHistory')}</div>}</div>
  </section>;
}
