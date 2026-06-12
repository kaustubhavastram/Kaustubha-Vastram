import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";

const CATEGORIES = ["all", "saree", "kurtha", "lehenga"];

const emptyProduct = {
  name: "",
  price: "",
  category: "midi",
  tag: "",
  image_url: "",
  alt: "",
  available: true,
};

export default function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id) && id !== "new";

  const [form, setForm] = useState(emptyProduct);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isEditing) {
      fetchProduct();
    }
  }, [id]);

  async function fetchProduct() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setForm({
        name: data.name || "",
        price: data.price?.toString() || "",
        category: data.category || "midi",
        tag: data.tag || "",
        image_url: data.image_url || "",
        alt: data.alt || "",
        available: data.available ?? true,
      });
    } catch (err) {
      setError("Product not found.");
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);

    const payload = {
      name: form.name.trim(),
      price: parseFloat(form.price),
      category: form.category,
      tag: form.tag.trim() || null,
      image_url: form.image_url.trim(),
      alt: form.alt.trim() || form.name.trim(),
      available: form.available,
    };

    if (!payload.name || isNaN(payload.price) || payload.price <= 0) {
      setError("Please fill in all required fields with valid values.");
      setSaving(false);
      return;
    }

    try {
      if (isEditing) {
        const { error } = await supabase
          .from("products")
          .update(payload)
          .eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("products").insert(payload);
        if (error) throw error;
      }

      navigate("/admin/products");
    } catch (err) {
      setError(err.message || "Failed to save product.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="admin__content">
        <h1>{isEditing ? "Edit Product" : "Add Product"}</h1>
        <div className="admin__loading">Loading…</div>
      </div>
    );
  }

  // Filter out 'all' from categories
  const productCategories = CATEGORIES.filter((c) => c !== "all");

  return (
    <div className="admin__content">
      <div className="admin__page-header">
        <h1>{isEditing ? "Edit Product" : "New Product"}</h1>
        <button
          className="btn btn--outline"
          onClick={() => navigate("/admin/products")}
        >
          ← Back to Products
        </button>
      </div>

      {error && <div className="admin__error">{error}</div>}

      <form className="admin__form" onSubmit={handleSubmit}>
        <div className="admin__form-grid">
          <div className="admin__form-group">
            <label htmlFor="name">Product Name *</label>
            <input
              id="name"
              name="name"
              type="text"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g. Arlet"
              required
            />
          </div>

          <div className="admin__form-group">
            <label htmlFor="price">Price (₹) *</label>
            <input
              id="price"
              name="price"
              type="number"
              step="0.01"
              min="0"
              value={form.price}
              onChange={handleChange}
              placeholder="245.00"
              required
            />
          </div>

          <div className="admin__form-group">
            <label htmlFor="category">Category *</label>
            <select
              id="category"
              name="category"
              value={form.category}
              onChange={handleChange}
            >
              {productCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="admin__form-group">
            <label htmlFor="tag">Tag</label>
            <input
              id="tag"
              name="tag"
              type="text"
              value={form.tag}
              onChange={handleChange}
              placeholder="e.g. New, Best seller, Limited"
            />
          </div>

          <div className="admin__form-group admin__form-group--full">
            <label htmlFor="image_url">Image URL *</label>
            <input
              id="image_url"
              name="image_url"
              type="url"
              value={form.image_url}
              onChange={handleChange}
              placeholder="https://images.unsplash.com/..."
              required
            />
          </div>

          <div className="admin__form-group admin__form-group--full">
            <label htmlFor="alt">Alt Text</label>
            <input
              id="alt"
              name="alt"
              type="text"
              value={form.alt}
              onChange={handleChange}
              placeholder="Description of the image"
            />
          </div>

          <div className="admin__form-group">
            <label className="admin__checkbox-label">
              <input
                type="checkbox"
                name="available"
                checked={form.available}
                onChange={handleChange}
              />
              <span>Available for purchase</span>
            </label>
          </div>
        </div>

        {form.image_url && (
          <div className="admin__form-preview">
            <h4>Image Preview</h4>
            <img
              src={form.image_url}
              alt="Preview"
              className="admin__form-preview-img"
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
          </div>
        )}

        <div className="admin__form-actions">
          <button
            type="button"
            className="btn btn--outline"
            onClick={() => navigate("/admin/products")}
          >
            Cancel
          </button>
          <button type="submit" className="btn btn--dark" disabled={saving}>
            {saving
              ? "Saving…"
              : isEditing
                ? "Update Product"
                : "Create Product"}
          </button>
        </div>
      </form>
    </div>
  );
}
