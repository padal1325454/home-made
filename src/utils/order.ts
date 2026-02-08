import { OrderStatus } from '../types';

export const statusSteps: OrderStatus[] = [
  'Draft',
  'Accepted',
  'Processing',
  'Prepared',
  'Delivered',
  'Awaiting Payment',
  'Paid',
  'Closed',
];

export const statusVariant = (status: OrderStatus) => {
  switch (status) {
    case 'Accepted':
    case 'Paid':
    case 'Closed':
      return 'success';
    case 'Processing':
    case 'Prepared':
    case 'Awaiting Payment':
      return 'warning';
    case 'Cancelled':
      return 'danger';
    default:
      return 'neutral';
  }
};
