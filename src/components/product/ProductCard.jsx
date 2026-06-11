import { useCart } from '../../context/CartContext';

export default function ProductCard({ product }) {
  const { addItem } = useCart();

  function handleAdd(e) {
    e.stopPropagation();
    addItem(product);
  }

  return (
    <div className="card" data-id={product.id}>
      <div className="card__media">
        <img
          src={product.image_url}
          alt={product.alt || product.name}
          loading="lazy"
          onError={(e) => e.target.parentElement.classList.add('img-fallback')}
        />
        {product.tag && <span className="card__tag">{product.tag}</span>}
        {!product.available && (
          <span className="card__tag card__tag--sold-out">Sold Out</span>
        )}
        <button
          className="card__add"
          onClick={handleAdd}
          disabled={!product.available}
          aria-label={`Add ${product.name} to cart`}
        >
          {product.available ? 'Add to Cart' : 'Sold Out'}
        </button>
      </div>
      <div className="card__name">{product.name}</div>
      <div className="card__meta">
        <span>{product.category.charAt(0).toUpperCase() + product.category.slice(1)}</span>
        <span className="card__price">₹{product.price.toFixed(2)}</span>
      </div>
    </div>
  );
}
