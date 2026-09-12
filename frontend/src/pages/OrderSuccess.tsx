import { Link, useLocation } from 'react-router-dom';

function money(value: number) {
  return `₹${Number(value || 0).toLocaleString('en-IN', {
    maximumFractionDigits: 2,
  })}`;
}

export default function OrderSuccess() {
  const location = useLocation();
  const order = location.state?.order;

  return (
    <section>
      <div className="panel success-card">
        <p className="eyebrow">ORDER CONFIRMED</p>

        <h2>Order placed successfully 🎉</h2>

        {order ? (
          <>
            <p className="muted">
              Your order has been created successfully.
            </p>

            <div className="success-details">
              <div>
                <span>Order number</span>
                <strong>{order.orderNumber}</strong>
              </div>

              <div>
                <span>Status</span>
                <strong>{order.status}</strong>
              </div>

              <div>
                <span>Total</span>
                <strong>{money(order.totalAmount)}</strong>
              </div>
            </div>

            <Link
              className="primary cart-link"
              to={`/orders/${order.id}`}
            >
              View order
            </Link>
          </>
        ) : (
          <p className="muted">
            Your order was placed. You can view it from your orders.
          </p>
        )}

        <Link className="back-button cart-link" to="/products">
          Continue shopping
        </Link>
      </div>
    </section>
  );
}