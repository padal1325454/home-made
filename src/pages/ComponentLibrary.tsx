import Badge from '../components/ui/Badge';
import Tabs from '../components/ui/Tabs';
import Skeleton from '../components/ui/Skeleton';

const ComponentLibrary = () => {
  return (
    <div className="page">
      <div className="card">
        <h2>Component Library</h2>
        <p className="text-secondary">Reusable UI elements used across the admin.</p>
      </div>
      <div className="card">
        <h3>Buttons</h3>
        <div className="action-row">
          <button className="btn-primary">Primary</button>
          <button className="btn-secondary">Secondary</button>
          <button className="link-btn">Link</button>
        </div>
      </div>
      <div className="card">
        <h3>Badges</h3>
        <div className="action-row">
          <Badge variant="success">Success</Badge>
          <Badge variant="warning">Warning</Badge>
          <Badge variant="danger">Danger</Badge>
          <Badge variant="neutral">Neutral</Badge>
          <Badge variant="info">Info</Badge>
        </div>
      </div>
      <div className="card">
        <h3>Tabs</h3>
        <Tabs
          tabs={[
            { id: 'one', label: 'Tab One' },
            { id: 'two', label: 'Tab Two' },
            { id: 'three', label: 'Tab Three' },
          ]}
          active="one"
          onChange={() => {}}
        />
      </div>
      <div className="card">
        <h3>Skeleton Loaders</h3>
        <div className="skeleton-list">
          <Skeleton height={14} />
          <Skeleton height={14} />
          <Skeleton width="60%" height={14} />
        </div>
      </div>
    </div>
  );
};

export default ComponentLibrary;
