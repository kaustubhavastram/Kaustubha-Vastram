import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import ProductCard from "./ProductCard";
import Filters from "./Filters";

export default function ProductGrid() {
  const [products, setProducts] = useState([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
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
        setProducts([]);
      }
    } catch (err) {
      console.warn("Error fetching products:", err.message);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }

  const trimmedQuery = searchQuery.trim().toLowerCase();

  const filtered = products.filter((p) => {
    // Category filter
    const matchesCategory =
      activeFilter === "all" || p.category === activeFilter;

    // Search filter (by name or product_code)
    const matchesSearch =
      trimmedQuery === "" ||
      p.name.toLowerCase().includes(trimmedQuery) ||
      (p.product_code && p.product_code.toLowerCase().includes(trimmedQuery));

    return matchesCategory && matchesSearch;
  });

  function handleSearchClear() {
    setSearchQuery("");
  }

  return (
    <section className="section collection" id="collection">
      <div className="container">
        <div className="section__head reveal">
          <p className="section__eyebrow">The Edit</p>
          <h2 className="section__title">Featured Dresses</h2>
        </div>

        {/* Search Bar */}
        <div className="search-bar" id="searchBar">
          <div className="search-bar__inner">
            <svg
              className="search-bar__icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              id="productSearch"
              type="text"
              className="search-bar__input"
              placeholder="Search by product name or ID…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search products"
            />
            {searchQuery && (
              <button
                className="search-bar__clear"
                onClick={handleSearchClear}
                aria-label="Clear search"
                type="button"
              >
                ×
              </button>
            )}
          </div>
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
          <div className="search-empty">
            {trimmedQuery ? (
              <>
                <div className="search-empty__icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    <line x1="8" y1="8" x2="14" y2="14" />
                    <line x1="14" y1="8" x2="8" y2="14" />
                  </svg>
                </div>
                <p className="search-empty__title">No results found</p>
                <p className="search-empty__subtitle">
                  No products match "<strong>{searchQuery}</strong>". Try a different name or product ID.
                </p>
                <button className="btn btn--outline search-empty__btn" onClick={handleSearchClear}>
                  Clear Search
                </button>
              </>
            ) : (
              <p className="search-empty__subtitle" style={{ fontStyle: "italic" }}>
                No dresses in this category yet — check back soon.
              </p>
            )}
          </div>
        ) : (
          <>
            {trimmedQuery && (
              <p className="search-results-count">
                {filtered.length} {filtered.length === 1 ? "result" : "results"} found
              </p>
            )}
            <div className="grid" id="productGrid">
              {filtered.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
