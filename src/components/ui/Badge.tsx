import { ReactNode } from 'react';

interface BadgeProps {
  variant?: 'success' | 'warning' | 'danger' | 'neutral' | 'info';
  children: ReactNode;
}

const Badge = ({ variant = 'neutral', children }: BadgeProps) => {
  return <span className={`badge badge-${variant}`}>{children}</span>;
};

export default Badge;
