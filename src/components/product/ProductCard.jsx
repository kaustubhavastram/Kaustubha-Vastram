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

  const hasDiscount =
    product.discount_price != null &&
    parseFloat(product.discount_price) < parseFloat(product.price);
  const discountPercent = hasDiscount
    ? Math.round(
        ((parseFloat(product.price) - parseFloat(product.discount_price)) /
          parseFloat(product.price)) *
          100
      )
    : 0;
  const effectivePrice = hasDiscount
    ? parseFloat(product.discount_price)
    : parseFloat(product.price);

  function handleAdd(e) {
    e.stopPropagation();
    e.preventDefault();
    if (!effectivelyAvailable) return;
    addItem({ ...product, price: effectivePrice });
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
        {(product.tag || isLowStock || !effectivelyAvailable || hasDiscount) && (
          <div className="card__tags">
            {hasDiscount && effectivelyAvailable && (
              <span className="card__tag card__tag--discount">
                {discountPercent}% OFF
              </span>
            )}
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
        {hasDiscount ? (
          <span className="card__price-group">
            <span className="card__price card__price--original">
              ₹{parseFloat(product.price).toFixed(2)}
            </span>
            <span className="card__price card__price--discount">
              ₹{parseFloat(product.discount_price).toFixed(2)}
            </span>
          </span>
        ) : (
          <span className="card__price">₹{product.price.toFixed(2)}</span>
        )}
      </div>
      {product.product_code && (
        <div className="card__product-code">ID: {product.product_code}</div>
      )}
    </Link>
  );
}

