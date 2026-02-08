import { TimelineEvent } from '../../types';

const Timeline = ({ events }: { events: TimelineEvent[] }) => {
  return (
    <div className="timeline">
      {events.map(event => (
        <div key={event.id} className="timeline-item">
          <div className="timeline-dot" />
          <div className="timeline-content">
            <div className="timeline-title">{event.action}</div>
            <div className="timeline-meta">
              {event.by} - {new Date(event.at).toLocaleString()}
            </div>
            {event.data ? (
              <div className="timeline-meta">
                {Object.entries(event.data)
                  .map(([key, value]) => `${key}: ${value}`)
                  .join(' | ')}
              </div>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Timeline;
