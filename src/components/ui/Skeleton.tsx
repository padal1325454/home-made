const Skeleton = ({ width = '100%', height = 12 }: { width?: string; height?: number }) => {
  return <div className="skeleton" style={{ width, height }} />;
};

export default Skeleton;
