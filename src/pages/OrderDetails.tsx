import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../state/AppState';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import Stepper from '../components/ui/Stepper';
import Timeline from '../components/ui/Timeline';
import { statusSteps, statusVariant } from '../utils/order';

const OrderDetails = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const {
    orders,
    customers,
    currentUser,
    settings,
    updateOrderStatus,
    recordPayment,
    closeOrder,
    cancelOrder,
    resendInvoice,
    sendStatusUpdate,
    messages,
    addToast,
  } = useApp();

  const order = orders.find(o => o.id === orderId);
  const customer = customers.find(c => c.id === order?.customerId);
  const [showCancel, setShowCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showPayment, setShowPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'Card'>('COD');
  const [amountReceived, setAmountReceived] = useState('');
  const [sendReceipt, setSendReceipt] = useState(true);
  const [showClose, setShowClose] = useState(false);
  const [closeNotes, setCloseNotes] = useState('');
  const [showResend, setShowResend] = useState(false);
  const [resendEmail, setResendEmail] = useState(true);
  const [resendSms, setResendSms] = useState(true);
  const [showStatusUpdate, setShowStatusUpdate] = useState(false);
  const [statusChannel, setStatusChannel] = useState<'Email' | 'SMS'>('SMS');
  const [statusMessage, setStatusMessage] = useState('');
  const [templateKey, setTemplateKey] = useState('custom');

  if (!order || !customer || !currentUser) {
    return (
      <div className="page">
        <div className="card">Order not found.</div>
      </div>
    );
  }

  const orderMessages = messages.filter(m => m.orderId === order.id);

  const statusActions = useMemo(() => {
    const actions: { label: string; next: string }[] = [];
    if (order.status === 'Accepted') actions.push({ label: 'Move to Processing', next: 'Processing' });
    if (order.status === 'Processing') actions.push({ label: 'Move to Prepared', next: 'Prepared' });
    if (order.status === 'Prepared') actions.push({ label: 'Move to Delivered', next: 'Delivered' });
    if (order.status === 'Delivered') actions.push({ label: 'Awaiting Payment', next: 'Awaiting Payment' });
    return actions;
  }, [order.status]);

  const canCancel = !['Delivered', 'Awaiting Payment', 'Paid', 'Closed', 'Cancelled'].includes(order.status);

  const onAdvanceStatus = (next: string) => {
    updateOrderStatus(order.id, next as any, currentUser.name);
    addToast(`Order moved to ${next}`);
  };

  const onRecordPayment = () => {
    const amount = parseFloat(amountReceived || '0');
    recordPayment({ orderId: order.id, method: paymentMethod, amount, sendReceipt, by: currentUser.name });
    addToast('Payment recorded');
    setShowPayment(false);
  };

  const onCloseOrder = () => {
    closeOrder(order.id, currentUser.name, closeNotes);
    addToast('Order closed');
    setShowClose(false);
  };

  const onCancelOrder = () => {
    if (!cancelReason.trim()) return;
    cancelOrder(order.id, currentUser.name, cancelReason.trim());
    addToast('Order cancelled');
    setShowCancel(false);
  };

  const onResendInvoice = () => {
    resendInvoice(order.id, currentUser.name, resendEmail, resendSms);
    addToast('Invoice resent');
    setShowResend(false);
  };

  const onStatusUpdate = () => {
    const message =
      templateKey === 'processing'
        ? settings.templates.statusProcessing
        : templateKey === 'prepared'
          ? settings.templates.statusPrepared
          : templateKey === 'delivered'
            ? settings.templates.statusDelivered
            : statusMessage || 'Status update sent.';
    sendStatusUpdate(order.id, currentUser.name, statusChannel, message);
    addToast('Status update sent');
    setShowStatusUpdate(false);
    setStatusMessage('');
    setTemplateKey('custom');
  };

  return (
    <div className="page">
      <div className="order-details-header card">
        <div>
          <h2>
            {order.orderNumber || 'Draft'} {order.invoiceNumber ? `— ${order.invoiceNumber}` : ''}
          </h2>
          <div className="badge-row">
            <Badge variant={statusVariant(order.status)}>{order.status}</Badge>
            {order.paymentStatus ? (
              <Badge variant={order.paymentStatus === 'Paid' ? 'success' : 'warning'}>
                {order.paymentStatus}
              </Badge>
            ) : null}
          </div>
        </div>
        <div className="actions-row">
          <button className="btn-secondary" onClick={() => navigate(`/admin/print/order/${order.id}`)}>Print Order</button>
          {order.invoiceNumber ? (
            <button className="btn-secondary" onClick={() => navigate(`/admin/print/invoice/${order.id}`)}>Print Invoice</button>
          ) : null}
          <button className="btn-secondary" disabled>
            Download PDF
          </button>
        </div>
      </div>

      <div className="order-details-grid">
        <div className="card">
          <h3>Customer</h3>
          <div className="detail-line"><strong>{customer.name}</strong></div>
          <div className="detail-line">{customer.phone}</div>
          <div className="detail-line">{customer.email || 'No email on file'}</div>
          <div className="action-row">
            <button className="btn-secondary">Send SMS</button>
            <button className="btn-secondary">Send Email</button>
          </div>
        </div>

        <div className="card">
          <h3>Items</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty/Weight</th>
                <th>Unit Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map(item => {
                const lineTotal =
                  item.pricingType === 'PER_LB'
                    ? (item.weightLbs || 0) * item.unitPrice
                    : (item.quantity || 0) * item.unitPrice;
                return (
                <tr key={item.id}>
                  <td>{item.productName}</td>
                  <td>{item.pricingType === 'PER_LB' ? `${item.weightLbs} lb` : item.quantity}</td>
                  <td>${item.unitPrice.toFixed(2)}</td>
                  <td>${lineTotal.toFixed(2)}</td>
                </tr>
              );
              })}
            </tbody>
          </table>
        </div>

        <div className="card">
          <h3>Totals</h3>
          <div className="total-row">
            <span>Subtotal</span>
            <span>${order.subtotal.toFixed(2)}</span>
          </div>
          <div className="total-row">
            <span>Tax</span>
            <span>${order.tax.toFixed(2)}</span>
          </div>
          <div className="total-row">
            <span>Fees</span>
            <span>${order.fees.toFixed(2)}</span>
          </div>
          <div className="total-row total">
            <span>Total</span>
            <span>${order.total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="card">
        <h3>Status</h3>
        <Stepper steps={statusSteps} activeStep={order.status} />
        <div className="action-row">
          {statusActions.map(action => (
            <button key={action.label} className="btn-secondary" onClick={() => onAdvanceStatus(action.next)}>
              {action.label}
            </button>
          ))}
          {order.status === 'Awaiting Payment' ? (
            <button className="btn-primary" onClick={() => setShowPayment(true)}>
              Record Payment
            </button>
          ) : null}
          {order.status === 'Paid' ? (
            <button className="btn-primary" onClick={() => setShowClose(true)}>
              Close Order
            </button>
          ) : null}
          {canCancel ? (
            <button className="btn-secondary" onClick={() => setShowCancel(true)}>
              Cancel Order
            </button>
          ) : null}
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>Notifications</h3>
          <div className="actions-row">
            {order.invoiceNumber ? (
              <button className="btn-secondary" onClick={() => setShowResend(true)}>
                Resend Invoice
              </button>
            ) : null}
            <button className="btn-secondary" onClick={() => setShowStatusUpdate(true)}>
              Send Status Update
            </button>
          </div>
        </div>
        <div className="message-log">
          {orderMessages.length === 0 ? (
            <div className="empty-hint">No messages sent yet.</div>
          ) : (
            orderMessages.map(msg => (
              <div key={msg.id} className="message-item">
                <strong>{msg.type}</strong> - {msg.channel} - {msg.status}
                <div className="text-secondary">
                  {msg.by} - {new Date(msg.at).toLocaleString()}
                </div>
                {msg.details ? <div className="text-secondary">{msg.details}</div> : null}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="card">
        <h3>Audit Timeline</h3>
        <Timeline events={order.timeline} />
      </div>

      <Modal
        open={showPayment}
        title="Record Payment"
        onClose={() => setShowPayment(false)}
        footer={
          <div className="modal-actions">
            <button className="btn-secondary" onClick={() => setShowPayment(false)}>Cancel</button>
            <button className="btn-primary" onClick={onRecordPayment}>Save Payment</button>
          </div>
        }
      >
        <div className="form-group">
          <label>Payment method</label>
          <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as any)}>
            <option value="COD">COD</option>
            <option value="Card">Card</option>
          </select>
        </div>
        <div className="form-group">
          <label>Amount due</label>
          <input type="text" value={order.total.toFixed(2)} readOnly />
        </div>
        <div className="form-group">
          <label>Amount received</label>
          <input value={amountReceived} onChange={e => setAmountReceived(e.target.value)} />
        </div>
        <label className="checkbox">
          <input type="checkbox" checked={sendReceipt} onChange={e => setSendReceipt(e.target.checked)} />
          Send receipt via Email and SMS
        </label>
      </Modal>

      <Modal
        open={showClose}
        title="Close Order"
        onClose={() => setShowClose(false)}
        footer={
          <div className="modal-actions">
            <button className="btn-secondary" onClick={() => setShowClose(false)}>Cancel</button>
            <button className="btn-primary" onClick={onCloseOrder}>Close Order</button>
          </div>
        }
      >
        <p>Closing the order makes it read-only.</p>
        <div className="form-group">
          <label>Notes (optional)</label>
          <textarea value={closeNotes} onChange={e => setCloseNotes(e.target.value)} />
        </div>
      </Modal>

      <Modal
        open={showCancel}
        title="Cancel Order"
        onClose={() => setShowCancel(false)}
        footer={
          <div className="modal-actions">
            <button className="btn-secondary" onClick={() => setShowCancel(false)}>Back</button>
            <button className="btn-primary" onClick={onCancelOrder}>Confirm Cancel</button>
          </div>
        }
      >
        <div className="form-group">
          <label>Reason for cancellation</label>
          <textarea value={cancelReason} onChange={e => setCancelReason(e.target.value)} />
        </div>
      </Modal>

      <Modal
        open={showResend}
        title="Resend Invoice"
        onClose={() => setShowResend(false)}
        footer={
          <div className="modal-actions">
            <button className="btn-secondary" onClick={() => setShowResend(false)}>Cancel</button>
            <button className="btn-primary" onClick={onResendInvoice}>Resend</button>
          </div>
        }
      >
        <label className="checkbox">
          <input type="checkbox" checked={resendEmail} onChange={e => setResendEmail(e.target.checked)} />
          Send Invoice Email
        </label>
        <label className="checkbox">
          <input type="checkbox" checked={resendSms} onChange={e => setResendSms(e.target.checked)} />
          Send Invoice SMS
        </label>
      </Modal>

      <Modal
        open={showStatusUpdate}
        title="Send Status Update"
        onClose={() => setShowStatusUpdate(false)}
        footer={
          <div className="modal-actions">
            <button className="btn-secondary" onClick={() => setShowStatusUpdate(false)}>Cancel</button>
            <button className="btn-primary" onClick={onStatusUpdate}>Send Update</button>
          </div>
        }
      >
        <div className="form-group">
          <label>Channel</label>
          <select value={statusChannel} onChange={e => setStatusChannel(e.target.value as any)}>
            <option value="SMS">SMS</option>
            <option value="Email">Email</option>
          </select>
        </div>
        <div className="form-group">
          <label>Template</label>
          <select value={templateKey} onChange={e => setTemplateKey(e.target.value)}>
            <option value="custom">Custom</option>
            <option value="processing">Processing</option>
            <option value="prepared">Prepared</option>
            <option value="delivered">Delivered</option>
          </select>
        </div>
        <div className="form-group">
          <label>Message</label>
          <textarea
            value={
              templateKey === 'custom'
                ? statusMessage
                : templateKey === 'processing'
                  ? settings.templates.statusProcessing
                  : templateKey === 'prepared'
                    ? settings.templates.statusPrepared
                    : settings.templates.statusDelivered
            }
            onChange={e => setStatusMessage(e.target.value)}
            placeholder="Your order is Processing."
            readOnly={templateKey !== 'custom'}
          />
        </div>
      </Modal>
    </div>
  );
};

export default OrderDetails;
