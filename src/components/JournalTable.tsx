import { useState } from 'react';
import type { LogEvent } from '../domain/model';
import { describeEvent, formatRealTime, formatSimTime } from '../app/format';
import { EVENT_LABELS, t } from '../app/strings.fr';

const PAGE_SIZE = 200;

/** Chronologie, la plus récente en premier, paginée pour rester fluide avec 10 000 événements. */
export function JournalTable({ events }: { events: LogEvent[] }) {
  const [limit, setLimit] = useState(PAGE_SIZE);
  if (events.length === 0) return <p className="empty">{t.journal.empty}</p>;
  const shown = events.slice(-limit).reverse();
  const c = t.journal.columns;
  return (
    <>
      <div className="table-wrap">
        <table className="journal-table">
          <thead>
            <tr>
              <th scope="col">{c.simTime}</th>
              <th scope="col">{c.realTime}</th>
              <th scope="col">{c.type}</th>
              <th scope="col">{c.patient}</th>
              <th scope="col">{c.details}</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((e) => (
              <tr key={e.id} data-type={e.type}>
                <td>{formatSimTime(e.simulatedSecond)}</td>
                <td>{formatRealTime(e.realTimestamp)}</td>
                <td>{EVENT_LABELS[e.type]}</td>
                <td>{e.patientId ?? '—'}</td>
                <td>{describeEvent(e)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="muted">
        {t.journal.count(shown.length, events.length)}{' '}
        {shown.length < events.length && (
          <button type="button" onClick={() => setLimit((l) => l + PAGE_SIZE)}>
            {t.journal.showMore}
          </button>
        )}
      </p>
    </>
  );
}
