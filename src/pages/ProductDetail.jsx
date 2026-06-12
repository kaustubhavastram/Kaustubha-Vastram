import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
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
      const { data, error: prodErr } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .single();

      if (prodErr) throw prodErr;
      setProduct(data);

      const { data: imgs, error: imgErr } = await supabase
        .from("product_images")
        .select("*")
        .eq("product_id", id)
        .order("sort_order", { ascending: true });

      if (!imgErr && imgs && imgs.length > 0) {
        setImages(imgs);
        const heroIdx = imgs.findIndex((img) => img.is_hero);
        setActiveImage(heroIdx >= 0 ? heroIdx : 0);
      } else if (data.image_url) {
        setImages([{ image_url: data.image_url, is_hero: true }]);
        setActiveImage(0);
      }
    } catch (err) {
      console.error("Error fetching product:", err);
      setError("Product not found.");
    } finally {
      setLoading(false);
    }
  }

  function handleAdd() {
    if (product) addItem(product);
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
              {product.tag && <span className="card__tag">{product.tag}</span>}
              {!product.available && (
                <span className="card__tag card__tag--sold-out">Sold Out</span>
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
            <div className="product-detail__price">
              ₹{parseFloat(product.price).toFixed(2)}
            </div>

            {product.description && (
              <p className="product-detail__description">
                {product.description}
              </p>
            )}

            <button
              className="btn btn--dark btn--full product-detail__add"
              onClick={handleAdd}
              disabled={!product.available}
            >
              {product.available ? "Add to Cart" : "Sold Out"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
