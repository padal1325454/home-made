interface TabItem {
  id: string;
  label: string;
}

interface TabsProps {
  tabs: TabItem[];
  active: string;
  onChange: (id: string) => void;
}

const Tabs = ({ tabs, active, onChange }: TabsProps) => {
  return (
    <div className="tabs">
      {tabs.map(tab => (
        <button
          key={tab.id}
          type="button"
          className={`tab ${active === tab.id ? 'active' : ''}`}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default Tabs;
