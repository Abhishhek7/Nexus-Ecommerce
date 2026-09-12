import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const nextStatuses: Record<string, string[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['SHIPPED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
};

export default function OrderDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>();
  const [error, setError] = useState('');

  async function load() {
    try { const r = await api.get(`/orders/${id}`); setOrder(r.data.data); }
    catch (err:any) { setError(err.response?.data?.message || 'Unable to load order'); }
  }
  useEffect(() => { load(); }, [id]);

  async function updateStatus(status: string) {
    try { await api.patch(`/orders/${id}/status`, { status }); await load(); }
    catch (err:any) { setError(err.response?.data?.message || 'Unable to update status'); }
  }
  async function cancel() {
    if (!window.confirm('Cancel this order?')) return;
    try { await api.post(`/orders/${id}/cancel`); await load(); }
    catch (err:any) { setError(err.response?.data?.message || 'Unable to cancel order'); }
  }

  if (error && !order) return <div className="panel error-panel">{error}</div>;
  if (!order) return <div className="panel loading">Loading order…</div>;

  const canManage = user?.role === 'ADMIN' || user?.role === 'VENDOR';
  const transitions = nextStatuses[order.status] || [];

  return <section>
    <div className="toolbar">
      <div><p className="eyebrow">ORDER DETAILS</p><h2>{order.orderNumber}</h2></div>
      <em>{order.status}</em>
    </div>
    {error && <div className="error-panel">{error}</div>}
    <div className="detail-grid">
      <div className="panel">
        <h3>Customer</h3><p>{order.customer.name}</p><small>{order.customer.email}</small>
        <hr/><h3>Products</h3>
        {order.items.map((item:any)=><div className="item" key={item.id}><span>{item.product.name} × {item.quantity}<small>Unit price: {money(item.unitPrice)}</small></span><b>{money(item.totalAmount)}</b></div>)}
      </div>
      <div className="panel">
        <h3>Summary</h3>
        <div className="item"><span>Subtotal</span><b>{money(order.subtotal)}</b></div>
        <div className="item"><span>Discount</span><b>-{money(order.discount)}</b></div>
        <div className="item"><span>Tax</span><b>{money(order.tax)}</b></div>
        <div className="item"><span>Shipping</span><b>{money(order.shippingFee)}</b></div>
        <hr/><div className="item total"><span>Total</span><b>{money(order.totalAmount)}</b></div>
        <p className="muted">Payment: {order.payment?.paymentMethod} · {order.payment?.status}</p>
        {canManage && transitions.length > 0 && <label className="status-control">Update status<select defaultValue="" onChange={e=>e.target.value&&updateStatus(e.target.value)}><option value="" disabled>Choose next status</option>{transitions.map(s=><option key={s}>{s}</option>)}</select></label>}
        {user?.role === 'CUSTOMER' && ['PENDING','CONFIRMED'].includes(order.status) && <button className="danger-button" onClick={cancel}>Cancel order</button>}
      </div>
    </div>
    <button className="back-button" onClick={()=>navigate('/orders')}>← Back to orders</button>
  </section>;
}
function money(value:any) { return `₹${Number(value||0).toLocaleString('en-IN',{maximumFractionDigits:2})}`; }
