import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { getCachedData, setCachedData } from "../lib/cache";
import { useCart } from "../context/CartContext";
import "../styles/product-detail.css";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();

  const [product, setProduct] = useState(null);
  const [images, setImages] = useState([]);
  const [activeImage, setActiveImage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchProduct();
  }, [id]);

  async function fetchProduct() {
    setLoading(true);
    setError("");
    try {
      const cachedProd = getCachedData(`product_${id}`);
      const cachedImgs = getCachedData(`product_images_${id}`);

      let prodData = cachedProd;
      let imgsData = cachedImgs;

      if (!prodData) {
        const { data, error: prodErr } = await supabase
          .from("products")
          .select("*")
          .eq("id", id)
          .single();

        if (prodErr) throw prodErr;
        prodData = data;
        setCachedData(`product_${id}`, data, 5);
      }
      
      setProduct(prodData);

      if (!imgsData) {
        const { data: imgs, error: imgErr } = await supabase
          .from("product_images")
          .select("*")
          .eq("product_id", id)
          .order("sort_order", { ascending: true });

        if (!imgErr && imgs && imgs.length > 0) {
          imgsData = imgs;
          setCachedData(`product_images_${id}`, imgs, 5);
        } else if (prodData.image_url) {
          imgsData = [{ image_url: prodData.image_url, is_hero: true }];
          setCachedData(`product_images_${id}`, imgsData, 5);
        }
      }

      if (imgsData && imgsData.length > 0) {
        setImages(imgsData);
        const heroIdx = imgsData.findIndex((img) => img.is_hero);
        setActiveImage(heroIdx >= 0 ? heroIdx : 0);
      }

    } catch (err) {
      console.error("Error fetching product:", err);
      setError("Product not found.");
    } finally {
      setLoading(false);
    }
  }

  const isInStock =
    product?.stock_quantity === null || product?.stock_quantity === undefined
      ? true
      : product?.stock_quantity > 0;
  const effectivelyAvailable = product?.available && isInStock;
  const isLowStock =
    product?.stock_quantity != null &&
    product?.stock_quantity > 0 &&
    product?.stock_quantity <= 4;

  function handleAdd() {
    if (product && effectivelyAvailable) addItem(product);
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p>Loading…</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="product-detail-page">
        <div className="container product-detail__empty">
          <h2>{error || "Product not found"}</h2>
          <button className="btn btn--dark" onClick={() => navigate("/")}>
            Back to Shop
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="product-detail-page">
      <div className="container">
        <Link
          to="/"
          className="checkout__back"
          style={{ display: "inline-block", marginBottom: "2rem" }}
        >
          ← Back to Shop
        </Link>

        <div className="product-detail__grid">
          <div className="product-detail__gallery">
            <div className="product-detail__main-image">
              <img
                src={images[activeImage]?.image_url}
                alt={product.alt || product.name}
                onError={(e) =>
                  e.target.parentElement.classList.add("img-fallback")
                }
              />
              {product.tag && effectivelyAvailable && <span className="card__tag">{product.tag}</span>}
              {!effectivelyAvailable && (
                <span className="card__tag card__tag--unavailable">Sold Out</span>
              )}
            </div>

            {images.length > 1 && (
              <div className="product-detail__thumbs">
                {images.map((img, idx) => (
                  <button
                    key={img.id || idx}
                    className={`product-detail__thumb${idx === activeImage ? " active" : ""}`}
                    onClick={() => setActiveImage(idx)}
                    aria-label={`View image ${idx + 1}`}
                  >
                    <img
                      src={img.image_url}
                      alt={`${product.name} ${idx + 1}`}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="product-detail__info">
            <p className="section__eyebrow">
              {product.category.charAt(0).toUpperCase() +
                product.category.slice(1)}
            </p>
            <h1 className="product-detail__title">{product.name}</h1>
            {product.product_code && (
              <div className="product-detail__code">
                Product ID: {product.product_code}
              </div>
            )}
            <div className="product-detail__price">
              ₹{parseFloat(product.price).toFixed(2)}
            </div>

            {product.description && (
              <p className="product-detail__description">
                {product.description}
              </p>
            )}

            {isLowStock && effectivelyAvailable && (
              <div className="product-detail__stock-warning">
                Only {product.stock_quantity} left in stock!
              </div>
            )}

            <div style={{ marginTop: "1rem", marginBottom: "1.5rem", padding: "1rem", backgroundColor: "#fff8e1", borderLeft: "4px solid #ffc107", borderRadius: "4px", fontSize: "0.85rem", color: "#5d4037", lineHeight: "1.5" }}>
              <strong>⚠️ Return & Replacement:</strong> If you receive any damaged items and want a complete return or replacement, please contact us via WhatsApp from the <Link to="/contact" style={{ fontWeight: "600", textDecoration: "underline", color: "inherit" }}>Contacts page</Link>. The original sticker must remain attached to the product for returns.
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                className="btn btn--outline btn--full product-detail__add"
                onClick={handleAdd}
                disabled={!effectivelyAvailable}
                style={{ flex: 1, padding: '1rem', border: '1px solid var(--ink)', background: 'transparent', color: 'var(--ink)' }}
              >
                {effectivelyAvailable ? "Add to Cart" : "Sold Out"}
              </button>
              <button
                className="btn btn--dark btn--full product-detail__add"
                onClick={() => {
                  if (product && effectivelyAvailable) {
                    navigate('/checkout', { state: { buyNowItem: { ...product, qty: 1 } } });
                  }
                }}
                disabled={!effectivelyAvailable}
                style={{ flex: 1 }}
              >
                Buy Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
