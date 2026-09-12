import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { useCart } from '../contexts/CartContext';

function money(value: number) {
  return `₹${Number(value || 0).toLocaleString('en-IN', {
    maximumFractionDigits: 2,
  })}`;
}

export default function Cart() {
  const navigate = useNavigate();
  const {
    items,
    subtotal,
    updateQuantity,
    removeFromCart,
  } = useCart();

  if (!items.length) {
    return (
      <section>
        <div className="toolbar">
          <div>
            <p className="eyebrow">SHOPPING</p>
            <h2>Your cart</h2>
          </div>
        </div>

        <div className="empty-cart panel">
          <ShoppingBag size={42} />
          <h3>Your cart is empty</h3>
          <p className="muted">
            Add some products before checking out.
          </p>

          <Link className="primary cart-link" to="/products">
            Browse products
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="toolbar">
        <div>
          <p className="eyebrow">SHOPPING</p>
          <h2>Your cart</h2>
        </div>

        <span className="muted">
          {items.length} product{items.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="cart-layout">
        <div className="panel cart-items">
          {items.map(item => (
            <div className="cart-item" key={item.productId}>
              <div>
                <h3>{item.name}</h3>
                <small>{item.sku}</small>
                <p>{money(item.price)} each</p>
              </div>

              <div className="cart-controls">
                <button
                  onClick={() =>
                    updateQuantity(item.productId, item.quantity - 1)
                  }
                  disabled={item.quantity <= 1}
                >
                  <Minus size={15} />
                </button>

                <strong>{item.quantity}</strong>

                <button
                  onClick={() =>
                    updateQuantity(item.productId, item.quantity + 1)
                  }
                  disabled={item.quantity >= item.availableQuantity}
                >
                  <Plus size={15} />
                </button>
              </div>

              <strong>
                {money(item.price * item.quantity)}
              </strong>

              <button
                className="remove-cart"
                onClick={() => removeFromCart(item.productId)}
                title="Remove"
              >
                <Trash2 size={17} />
              </button>
            </div>
          ))}
        </div>

        <div className="panel cart-summary">
          <p className="eyebrow">SUMMARY</p>
          <h3>Order summary</h3>

          <div className="summary-row">
            <span>Subtotal</span>
            <strong>{money(subtotal)}</strong>
          </div>

          <div className="summary-row">
            <span>Shipping</span>
            <strong>Calculated at checkout</strong>
          </div>

          <button
            className="primary checkout-button"
            onClick={() => navigate('/checkout')}
          >
            Proceed to checkout
          </button>
        </div>
      </div>
    </section>
  );
}