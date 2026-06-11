import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setProducts(data || []);
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  }

  async function toggleAvailability(id, currentValue) {
    const { error } = await supabase
      .from('products')
      .update({ available: !currentValue })
      .eq('id', id);

    if (!error) {
      setProducts((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, available: !currentValue } : p
        )
      );
    }
  }

  async function deleteProduct(id) {
    const { error } = await supabase.from('products').delete().eq('id', id);

    if (!error) {
      setProducts((prev) => prev.filter((p) => p.id !== id));
      setDeleteId(null);
    }
  }

  if (loading) {
    return (
      <div className="admin__content">
        <h1>Products</h1>
        <div className="admin__loading">Loading products…</div>
      </div>
    );
  }

  return (
    <div className="admin__content">
      <div className="admin__page-header">
        <h1>Products</h1>
        <button
          className="btn btn--dark"
          onClick={() => navigate('/admin/products/new')}
        >
          + Add Product
        </button>
      </div>

      {products.length === 0 ? (
        <p className="admin__empty">No products found. Add your first product!</p>
      ) : (
        <table className="admin__table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Tag</th>
              <th>Available</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td>
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="admin__product-thumb"
                    onError={(e) => {
                      e.target.style.background = 'var(--cream-2)';
                      e.target.src = '';
                    }}
                  />
                </td>
                <td className="admin__product-name">{product.name}</td>
                <td>
                  <span className="admin__category-badge">
                    {product.category}
                  </span>
                </td>
                <td>₹{parseFloat(product.price).toFixed(2)}</td>
                <td>{product.tag || '—'}</td>
                <td>
                  <label className="admin__toggle">
                    <input
                      type="checkbox"
                      checked={product.available}
                      onChange={() => toggleAvailability(product.id, product.available)}
                    />
                    <span className="admin__toggle-slider" />
                  </label>
                </td>
                <td>
                  <div className="admin__actions">
                    <button
                      className="admin__action-btn admin__action-btn--edit"
                      onClick={() => navigate(`/admin/products/${product.id}`)}
                    >
                      Edit
                    </button>
                    <button
                      className="admin__action-btn admin__action-btn--delete"
                      onClick={() => setDeleteId(product.id)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Delete confirmation modal */}
      {deleteId && (
        <>
          <div className="admin__modal-overlay" onClick={() => setDeleteId(null)} />
          <div className="admin__modal">
            <h3>Delete Product?</h3>
            <p>This action cannot be undone. The product will be permanently removed.</p>
            <div className="admin__modal-actions">
              <button
                className="btn btn--outline"
                onClick={() => setDeleteId(null)}
              >
                Cancel
              </button>
              <button
                className="btn btn--danger"
                onClick={() => deleteProduct(deleteId)}
              >
                Delete
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
