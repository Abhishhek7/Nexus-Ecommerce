import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';

export default function Orders() {
  const [result, setResult] = useState<any>({ data: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } });
  const [filters, setFilters] = useState({ search: '', status: '', date: '' });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true); setError('');
    try {
      const params = Object.fromEntries(Object.entries({ ...filters, page, limit: 20 }).filter(([, value]) => value !== ''));
      const r = await api.get('/orders', { params });
      setResult(r.data.data);
    } catch (err: any) { setError(err.response?.data?.message || 'Unable to load orders'); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, [filters, page]);

  return <section>
    <div className="toolbar"><div><p className="eyebrow">FULFILLMENT</p><h2>Order management</h2></div></div>
    <div className="filters panel">
      <div className="search"><input placeholder="Search order number" value={filters.search} onChange={e=>{setPage(1);setFilters(f=>({...f,search:e.target.value}))}}/></div>
      <select value={filters.status} onChange={e=>{setPage(1);setFilters(f=>({...f,status:e.target.value}))}}><option value="">All statuses</option>{['PENDING','CONFIRMED','PROCESSING','SHIPPED','DELIVERED','CANCELLED'].map(s=><option key={s}>{s}</option>)}</select>
      <input type="date" value={filters.date} onChange={e=>{setPage(1);setFilters(f=>({...f,date:e.target.value}))}}/>
    </div>
    {error && <div className="error-panel">{error}</div>}
    <div className="table">
      <div className="tr th"><span>Order</span><span>Customer</span><span>Items</span><span>Amount</span><span>Payment</span><span>Status</span></div>
      {loading ? <div className="empty">Loading orders…</div> :
        result.data?.length ? result.data.map((o:any)=><Link className="tr rowlink" to={`/orders/${o.id}`} key={o.id}>
          <span><b>{o.orderNumber}</b><small>{new Date(o.createdAt).toLocaleDateString('en-IN')}</small></span>
          <span>{o.customer?.name}</span><span>{o.items?.reduce((s:number,i:any)=>s+i.quantity,0)}</span>
          <span>{money(o.totalAmount)}</span><span>{o.payment?.status}</span><span><em>{o.status}</em></span>
        </Link>) : <div className="empty">No orders match the current filters.</div>}
    </div>
    <div className="pagination"><button disabled={page<=1} onClick={()=>setPage(page-1)}>Previous</button><span>Page {page} of {result.pagination?.totalPages || 1} · {result.pagination?.total || 0} orders</span><button disabled={page>=result.pagination?.totalPages} onClick={()=>setPage(page+1)}>Next</button></div>
  </section>;
}
function money(value:any) { return `₹${Number(value||0).toLocaleString('en-IN',{maximumFractionDigits:2})}`; }
