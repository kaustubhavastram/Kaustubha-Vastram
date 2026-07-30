import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { sendNewProductEmail } from "../../lib/emailService";
import { clearCachePrefix } from "../../lib/cache";

const CATEGORIES = ["all", "georgette", "fancy saree", "soft cotton"];

const DISPLAY_PRIORITIES = [
  { value: "premium", label: "Premium", desc: "Displayed on top" },
  { value: "best", label: "Best", desc: "Displayed after Premium" },
  { value: "good", label: "Good", desc: "Displayed after Premium & Best" },
];

const emptyProduct = {
  name: "",
  product_code: "",
  price: "",
  discount_price: "",
  category: "georgette",
  tag: "",
  alt: "",
  available: true,
  description: "",
  stock_quantity: "",
  display_priority: "good",
};

export default function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id) && id !== "new";

  const [form, setForm] = useState(emptyProduct);
  const [images, setImages] = useState([]); // {id?, image_url, is_hero, file?, _localPreview?}
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
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
        product_code: data.product_code || "",
        price: data.price?.toString() || "",
        discount_price: data.discount_price != null ? data.discount_price.toString() : "",
        category: data.category || "georgette",
        tag: data.tag || "",
        alt: data.alt || "",
        available: data.available ?? true,
        description: data.description || "",
        stock_quantity: data.stock_quantity != null ? data.stock_quantity.toString() : "",
        display_priority: data.display_priority || "good",
      });

      const { data: imgs, error: imgErr } = await supabase
        .from("product_images")
        .select("*")
        .eq("product_id", id)
        .order("sort_order", { ascending: true });

      if (!imgErr && imgs) {
        if (imgs.length > 0) {
          setImages(
            imgs.map((img) => ({
              id: img.id,
              image_url: img.image_url,
              is_hero: img.is_hero,
            })),
          );
        } else if (data.image_url) {
          // Legacy product with only a single image_url, no rows yet
          setImages([{ image_url: data.image_url, is_hero: true }]);
        }
      }
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

  async function handleFileSelect(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    setError("");

    try {
      const uploaded = [];
      for (const file of files) {
        // 1. Get presigned URL from our backend
        const res = await fetch("/api/get-upload-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: file.name,
            fileType: file.type || "application/octet-stream",
          }),
        });
        
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Failed to get upload URL");
        }
        
        const { uploadUrl, publicUrl } = await res.json();

        // 2. Upload directly to Cloudflare R2
        const uploadRes = await fetch(uploadUrl, {
          method: "PUT",
          headers: {
            "Content-Type": file.type || "application/octet-stream",
          },
          body: file,
        });

        if (!uploadRes.ok) {
          throw new Error("Failed to upload image to R2");
        }

        uploaded.push({
          image_url: publicUrl,
          is_hero: false,
        });
      }

      setImages((prev) => {
        const combined = [...prev, ...uploaded];
        // If nothing is marked hero yet, mark the first uploaded as hero
        if (!combined.some((img) => img.is_hero) && combined.length > 0) {
          combined[0] = { ...combined[0], is_hero: true };
        }
        return combined;
      });
    } catch (err) {
      setError(err.message || "Image upload failed.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  function setHero(index) {
    setImages((prev) =>
      prev.map((img, i) => ({ ...img, is_hero: i === index })),
    );
  }

  function removeImage(index) {
    setImages((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      if (updated.length > 0 && !updated.some((img) => img.is_hero)) {
        updated[0] = { ...updated[0], is_hero: true };
      }
      return updated;
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);

    const heroImage = images.find((img) => img.is_hero) || images[0];

    const stockVal = form.stock_quantity.trim();
    const stockQuantity = stockVal === "" ? null : parseInt(stockVal, 10);

    const productCode = form.product_code.trim() || null;

    const discountVal = form.discount_price.trim();
    const discountPrice = discountVal === "" ? null : parseFloat(discountVal);

    const payload = {
      name: form.name.trim(),
      product_code: productCode,
      price: parseFloat(form.price),
      discount_price: discountPrice,
      category: form.category,
      tag: form.tag.trim() || null,
      image_url: heroImage ? heroImage.image_url : "",
      alt: form.alt.trim() || form.name.trim(),
      available: form.available,
      description: form.description.trim(),
      stock_quantity: stockQuantity,
      display_priority: form.display_priority,
    };

    if (!payload.name || isNaN(payload.price) || payload.price <= 0) {
      setError("Please fill in all required fields with valid values.");
      setSaving(false);
      return;
    }

    if (images.length === 0) {
      setError("Please upload at least one product image.");
      setSaving(false);
      return;
    }

    // Check product_code uniqueness
    if (productCode) {
      let query = supabase
        .from("products")
        .select("id")
        .eq("product_code", productCode);

      if (isEditing) {
        query = query.neq("id", id);
      }

      const { data: existing } = await query;
      if (existing && existing.length > 0) {
        setError(`Product ID "${productCode}" is already in use. Please choose a unique ID.`);
        setSaving(false);
        return;
      }
    }

    try {
      let productId = id;

      if (isEditing) {
        const { error } = await supabase
          .from("products")
          .update(payload)
          .eq("id", id);
        if (error) throw error;
      } else {
        const { data: inserted, error } = await supabase
          .from("products")
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        productId = inserted.id;
      }

      // Replace product_images rows for this product
      await supabase
        .from("product_images")
        .delete()
        .eq("product_id", productId);

      const imageRows = images.map((img, idx) => ({
        product_id: productId,
        image_url: img.image_url,
        is_hero: img.is_hero,
        sort_order: idx,
      }));

      const { error: imgErr } = await supabase
        .from("product_images")
        .insert(imageRows);
      if (imgErr) throw imgErr;

      // Send new-product notification email to admin (only for new products)
      if (!isEditing) {
        sendNewProductEmail({
          name: payload.name,
          price: payload.price,
          category: payload.category,
          imageUrl: payload.image_url,
        });
      }

      clearCachePrefix('all_products');
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
            <label htmlFor="product_code">Product ID</label>
            <input
              id="product_code"
              name="product_code"
              type="text"
              value={form.product_code}
              onChange={handleChange}
              placeholder="e.g. KV-SAR-001"
            />
            <span className="admin__form-help">
              Unique identifier for this product. Customers can search by this ID.
            </span>
          </div>

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
            <label htmlFor="discount_price">Discount Price (₹)</label>
            <input
              id="discount_price"
              name="discount_price"
              type="number"
              step="0.01"
              min="0"
              value={form.discount_price}
              onChange={handleChange}
              placeholder="e.g. 199.00"
            />
            {form.price && form.discount_price && parseFloat(form.discount_price) < parseFloat(form.price) && (
              <span className="admin__form-help" style={{ color: '#2e7d32', fontWeight: 600 }}>
                {Math.round(((parseFloat(form.price) - parseFloat(form.discount_price)) / parseFloat(form.price)) * 100)}% OFF
              </span>
            )}
            {form.price && form.discount_price && parseFloat(form.discount_price) >= parseFloat(form.price) && (
              <span className="admin__form-help" style={{ color: '#c62828' }}>
                Discount price must be less than the original price
              </span>
            )}
            <span className="admin__form-help">
              Leave blank for no discount
            </span>
          </div>

          <div className="admin__form-group">
            <label htmlFor="stock_quantity">Stock Quantity</label>
            <input
              id="stock_quantity"
              name="stock_quantity"
              type="number"
              min="0"
              step="1"
              value={form.stock_quantity}
              onChange={handleChange}
              placeholder="e.g. 25"
            />
            <span className="admin__form-help">
              Leave blank for unlimited stock
            </span>
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

          <div className="admin__form-group">
            <label htmlFor="display_priority">Display Priority *</label>
            <select
              id="display_priority"
              name="display_priority"
              value={form.display_priority}
              onChange={handleChange}
            >
              {DISPLAY_PRIORITIES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label} — {p.desc}
                </option>
              ))}
            </select>
            <span className="admin__form-help">
              Controls where this product appears in the store — Premium products show first, then Best, then Good.
            </span>
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

          <div className="admin__form-group admin__form-group--full">
            <label htmlFor="description">Product Description</label>
            <textarea
              id="description"
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Fabric, fit, care instructions, styling notes…"
              rows="4"
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

        {/* ---------- Image upload ---------- */}
        <div className="admin__form-preview">
          <h4>Product Images</h4>
          <p className="admin__image-help">
            Upload one or more images from your device. Click an image to set it
            as the hero image shown on the homepage.
          </p>

          <label className="admin__upload-btn">
            {uploading ? "Uploading…" : "+ Upload Images"}
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              disabled={uploading}
              style={{ display: "none" }}
            />
          </label>

          {images.length > 0 && (
            <div className="admin__image-grid">
              {images.map((img, idx) => (
                <div
                  key={img.id || img.image_url + idx}
                  className={`admin__image-item${img.is_hero ? " admin__image-item--hero" : ""}`}
                >
                  <img
                    src={img.image_url}
                    alt={`Product image ${idx + 1}`}
                    onClick={() => setHero(idx)}
                  />
                  {img.is_hero && (
                    <span className="admin__image-hero-badge">Hero</span>
                  )}
                  <button
                    type="button"
                    className="admin__image-remove"
                    onClick={() => removeImage(idx)}
                    aria-label="Remove image"
                  >
                    &times;
                  </button>
                  {!img.is_hero && (
                    <button
                      type="button"
                      className="admin__image-sethero"
                      onClick={() => setHero(idx)}
                    >
                      Set as hero
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="admin__form-actions">
          <button
            type="button"
            className="btn btn--outline"
            onClick={() => navigate("/admin/products")}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn--dark"
            disabled={saving || uploading}
          >
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
