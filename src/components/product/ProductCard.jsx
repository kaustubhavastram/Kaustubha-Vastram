import { Link } from "react-router-dom";
import { useCart } from "../../context/CartContext";

export default function ProductCard({ product }) {
  const { addItem } = useCart();

  const isInStock =
    product.stock_quantity === null || product.stock_quantity === undefined
      ? true
      : product.stock_quantity > 0;
  const effectivelyAvailable = product.available && isInStock;
  const isLowStock =
    product.stock_quantity != null &&
    product.stock_quantity > 0 &&
    product.stock_quantity <= 4;

  function handleAdd(e) {
    e.stopPropagation();
    e.preventDefault();
    if (!effectivelyAvailable) return;
    addItem(product);
  }

  return (
    <Link to={`/product/${product.id}`} className="card" data-id={product.id}>
      <div className="card__media">
        <img
          src={product.image_url}
          alt={product.alt || product.name}
          loading="lazy"
          onError={(e) => e.target.parentElement.classList.add("img-fallback")}
        />
        {(product.tag || isLowStock || !effectivelyAvailable) && (
          <div className="card__tags">
            {product.tag && effectivelyAvailable && (
              <span className="card__tag">{product.tag}</span>
            )}
            {isLowStock && effectivelyAvailable && (
              <span className="card__tag card__tag--low-stock">
                Only {product.stock_quantity} left!
              </span>
            )}
            {!effectivelyAvailable && (
              <span className="card__tag card__tag--unavailable">Sold Out</span>
            )}
          </div>
        )}
      </div>
      <button
        className="card__add"
        onClick={handleAdd}
        disabled={!effectivelyAvailable}
        aria-label={`Add ${product.name} to cart`}
      >
        {effectivelyAvailable ? "Add to Cart" : "Sold Out"}
      </button>
      <div className="card__name">{product.name}</div>
      <div className="card__meta">
        <span>
          {product.category.charAt(0).toUpperCase() + product.category.slice(1)}
        </span>
        <span className="card__price">₹{product.price.toFixed(2)}</span>
      </div>
      {product.product_code && (
        <div className="card__product-code">ID: {product.product_code}</div>
      )}
    </Link>
  );
}

