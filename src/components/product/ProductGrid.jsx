import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import ProductCard from "./ProductCard";
import Filters from "./Filters";

export default function ProductGrid() {
  const [products, setProducts] = useState([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        setProducts(data);
      } else {
        // No products available yet
        setProducts([]);
      }
    } catch (err) {
      console.warn("Error fetching products:", err.message);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }

  const filtered =
    activeFilter === "all"
      ? products
      : products.filter((p) => p.category === activeFilter);

  return (
    <section className="section collection" id="collection">
      <div className="container">
        <div className="section__head reveal">
          <p className="section__eyebrow">The Edit</p>
          <h2 className="section__title">Featured Dresses</h2>
        </div>

        <Filters activeFilter={activeFilter} onFilterChange={setActiveFilter} />

        {loading ? (
          <div className="grid">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="card card--skeleton">
                <div className="card__media skeleton-pulse" />
                <div className="card__name skeleton-text" />
                <div className="card__meta skeleton-text skeleton-text--short" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p
            style={{
              textAlign: "center",
              color: "var(--ink-soft)",
              padding: "4rem 0",
              fontFamily: "var(--font-serif)",
              fontSize: "1.15rem",
              fontStyle: "italic",
            }}
          >
            No dresses in this category yet — check back soon.
          </p>
        ) : (
          <div className="grid" id="productGrid">
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
