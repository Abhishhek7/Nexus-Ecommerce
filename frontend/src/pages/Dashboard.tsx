import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

type DashboardData = Record<string, any>;

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const endpoint = user?.role === 'VENDOR' ? '/vendors/me/dashboard' : user?.role === 'CUSTOMER' ? '/orders?page=1&limit=100' : '/admin/dashboard';
    api.get(endpoint).then((response) => {
      if (user?.role === 'CUSTOMER') {
        const rows = response.data.data?.data || [];
        setData({ totalOrders: rows.length, totalSpent: rows.reduce((sum: number, o: any) => sum + Number(o.totalAmount || 0), 0), customerOrders: rows });
      } else setData(response.data.data);
    })
      .catch((err) => setError(err.response?.data?.message || 'Unable to load dashboard'));
  }, [user?.role]);

  if (error) return <div className="panel error-panel">{error}</div>;
  if (!data) return <div className="panel loading">Loading dashboard…</div>;

  const cards = user?.role === 'CUSTOMER'
    ? [['My Orders', data.totalOrders], ['Total Spent', money(data.totalSpent)]]
    : user?.role === 'VENDOR'
    ? [
        ['Total Products', data.totalProducts], ['Active Products', data.activeProducts],
        ['Total Orders', data.totalOrders], ['Items Sold', data.totalItemsSold],
        ['Revenue', money(data.totalRevenue)], ['Average Order', money(data.averageOrderValue)],
      ]
    : [
        ['Total Orders', data.totalOrders], ['Revenue', money(data.totalRevenue)],
        ['Products', data.totalProducts], ['Customers', data.totalCustomers],
        ['Vendors', data.totalVendors], ['Completed Orders', data.completedOrders],
      ];

  const chart = (data.monthlyRevenue || []).map((row: any) => ({
    month: String(row.month ?? row.period), revenue: Number(row.revenue ?? row.netRevenue ?? 0),
  }));

  return (
    <section>
      <div className="grid stats-grid">
        {cards.map(([title, value]) => <Card key={String(title)} title={String(title)} value={value} />)}
      </div>

      {user?.role !== 'CUSTOMER' && <>
        <div className="panel">
          <div className="panel-head">
            <div><p className="eyebrow">REVENUE</p><h2>Monthly performance</h2></div>
          </div>
          {chart.length ? (
            <div className="chart">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chart}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => money(Number(value))} />
                  <Bar dataKey="revenue" radius={[7, 7, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : <Empty text="No revenue data yet." />}
        </div>

        <div className="two-panels">
          <RankList title="Top Products" items={data.topProducts || data.top5Products || []} />
          <RankList title={user?.role === 'VENDOR' ? 'Top Categories' : 'Top Vendors'}
            items={user?.role === 'VENDOR' ? (data.top5Categories || []) : (data.topVendors || [])} />
        </div>
      </>}
    </section>
  );
}

function Card({ title, value }: { title: string; value: any }) {
  return <div className="stat"><span>{title}</span><strong>{value ?? '—'}</strong><small>Live platform metric</small></div>;
}
function RankList({ title, items }: { title: string; items: any[] }) {
  return <div className="panel"><div className="panel-head"><h3>{title}</h3></div>
    {items.length ? items.map((item, i) => <div className="rank" key={item.productId ?? item.vendorId ?? item.categoryId ?? i}>
      <span><b>{item.name ?? item.groupName ?? item.productName}</b><small>{item.quantitySold ?? item.itemsSold ?? ''} items</small></span>
      <strong>{money(item.revenue ?? item.netRevenue)}</strong>
    </div>) : <Empty text="No data yet." />}
  </div>;
}
function Empty({ text }: { text: string }) { return <div className="empty">{text}</div>; }
function money(value: number) { return `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`; }
