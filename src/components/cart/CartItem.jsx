import { useCart } from '../../context/CartContext';

export default function CartItem({ item }) {
  const { updateQty, removeItem } = useCart();

  return (
    <div className="cart-item" data-id={item.id}>
      <img
        className="cart-item__img"
        src={item.image_url}
        alt={item.alt || item.name}
        onError={(e) => { e.target.style.display = 'none'; }}
      />
      <div>
        <div className="cart-item__name">{item.name}</div>
        <div className="cart-item__price">
          ₹{(item.price * item.qty).toFixed(2)}
        </div>
        <div className="cart-item__qty">
          <button
            onClick={() => updateQty(item.id, -1)}
            aria-label="Decrease quantity"
          >
            &minus;
          </button>
          <span>{item.qty}</span>
          <button
            onClick={() => updateQty(item.id, 1)}
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
      </div>
      <button
        className="cart-item__remove"
        onClick={() => removeItem(item.id)}
        aria-label={`Remove ${item.name}`}
      >
        &times;
      </button>
    </div>
  );
}
