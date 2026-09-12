import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useCart } from '../contexts/CartContext';

function money(value: number) {
  return `₹${Number(value || 0).toLocaleString('en-IN', {
    maximumFractionDigits: 2,
  })}`;
}

export default function Checkout() {
  const navigate = useNavigate();

  const {
    items,
    subtotal,
    clearCart,
  } = useCart();

  const [paymentMethod, setPaymentMethod] = useState('CARD');
  const [couponCode, setCouponCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function placeOrder(e: FormEvent) {
    e.preventDefault();

    if (!items.length) {
      setError('Your cart is empty.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload: any = {
        items: items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
        paymentMethod,
      };

      if (couponCode.trim()) {
        payload.couponCode = couponCode.trim();
      }

      const response = await api.post('/orders', payload);

      const order = response.data.data;

      clearCart();

      navigate(`/order-success/${order.id}`, {
        state: { order },
      });
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          'Unable to place your order.'
      );
    } finally {
      setLoading(false);
    }
  }

  if (!items.length) {
    return (
      <section>
        <div className="panel empty">
          Your cart is empty.
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="toolbar">
        <div>
          <p className="eyebrow">CHECKOUT</p>
          <h2>Complete your order</h2>
        </div>
      </div>

      {error && (
        <div className="error-panel">
          {error}
        </div>
      )}

      <div className="checkout-layout">
        <form className="panel checkout-form" onSubmit={placeOrder}>
          <h3>Payment method</h3>

          <label>
            Payment method

            <select
              value={paymentMethod}
              onChange={e => setPaymentMethod(e.target.value)}
            >
              <option value="CARD">Card</option>
              <option value="UPI">UPI</option>
              <option value="COD">Cash on Delivery</option>
            </select>
          </label>

          <label>
            Coupon code

            <input
              value={couponCode}
              onChange={e => setCouponCode(e.target.value)}
              placeholder="Optional coupon"
            />
          </label>

          <button
            className="primary"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Placing order...' : 'Place order'}
          </button>
        </form>

        <div className="panel">
          <p className="eyebrow">YOUR ITEMS</p>
          <h3>Order summary</h3>

          {items.map(item => (
            <div className="summary-row" key={item.productId}>
              <span>
                {item.name} × {item.quantity}
              </span>

              <strong>
                {money(item.price * item.quantity)}
              </strong>
            </div>
          ))}

          <hr />

          <div className="summary-row total">
            <span>Subtotal</span>
            <strong>{money(subtotal)}</strong>
          </div>

          <small className="muted">
            Final tax, shipping and discount are calculated by
            the backend during order creation.
          </small>
        </div>
      </div>
    </section>
  );
}