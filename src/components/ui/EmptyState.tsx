const EmptyState = ({ title, description }: { title: string; description: string }) => {
  return (
    <div className="empty-state">
      <div className="empty-state-card">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  );
};

export default EmptyState;
