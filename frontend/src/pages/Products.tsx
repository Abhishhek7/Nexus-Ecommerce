import { FormEvent, useEffect, useState } from 'react';
import {
  Pencil,
  Plus,
  Search,
  ShoppingCart,
  Trash2,
  X,
} from 'lucide-react';

import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';

type Product = any;

const emptyForm = {
  vendorId: '',
  categoryId: '',
  name: '',
  sku: '',
  description: '',
  price: '',
  status: 'ACTIVE',
  initialQuantity: '0',
};

export default function Products() {
  const { user } = useAuth();
  const { addToCart } = useCart();

  const [result, setResult] = useState({
    data: [],
    pagination: {
      page: 1,
      limit: 12,
      total: 0,
      totalPages: 0,
    },
  });

  const [categories, setCategories] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);

  const [filters, setFilters] = useState({
    search: '',
    categoryId: '',
    vendorId: '',
    status: '',
    inStock: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  const [page, setPage] = useState(1);

  const [form, setForm] = useState<any>(emptyForm);

  const [editing, setEditing] = useState<Product | null>(null);

  const [showForm, setShowForm] = useState(false);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');

    try {
      const params = Object.fromEntries(
        Object.entries({
          ...filters,
          page,
          limit: 12,
          categoryTree: true,
        }).filter(([, value]) => value !== '')
      );

      const response = await api.get('/products', { params });

      setResult(response.data.data);
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Unable to load products'
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [filters, page]);

  useEffect(() => {
    api
      .get('/categories')
      .then((r) => setCategories(flattenCategories(r.data.data)));

    if (user?.role === 'ADMIN') {
      api.get('/vendors').then((r) => setVendors(r.data.data));
    }
  }, [user?.role]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function openEdit(product: Product) {
    setEditing(product);

    setForm({
      ...emptyForm,
      categoryId: String(product.categoryId),
      vendorId: String(product.vendorId),
      name: product.name,
      sku: product.sku,
      description: product.description || '',
      price: String(product.price),
      status: product.status,
    });

    setShowForm(true);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError('');

    try {
      const payload: any = {
        categoryId: Number(form.categoryId),
        name: form.name,
        sku: form.sku,
        description: form.description,
        price: Number(form.price),
        status: form.status,
      };

      if (!editing) {
        payload.initialQuantity = Number(form.initialQuantity);
      }

      if (user?.role === 'ADMIN') {
        payload.vendorId = Number(form.vendorId);
      }

      if (editing) {
        await api.patch(`/products/${editing.id}`, payload);
      } else {
        await api.post('/products', payload);
      }

      setShowForm(false);

      await load();
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Unable to save product'
      );
    }
  }

  async function remove(id: number) {
    if (!window.confirm('Deactivate this product?')) return;

    try {
      await api.delete(`/products/${id}`);

      await load();
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Unable to delete product'
      );
    }
  }

  function handleAddToCart(product: Product) {
    const availableQuantity =
      product.inventory?.availableQuantity ?? 0;

    if (product.status !== 'ACTIVE') {
      return;
    }

    if (availableQuantity <= 0) {
      return;
    }

    addToCart({
      productId: product.id,
      name: product.name,
      sku: product.sku,
      price: Number(product.price),
      quantity: 1,
      availableQuantity,
    });
  }

  return (
    <section>
      {/* HEADER */}
      <div className="toolbar">
        <div>
          <p className="eyebrow">CATALOG</p>

          <h2>
            {user?.role === 'CUSTOMER'
              ? 'Products'
              : 'Product management'}
          </h2>
        </div>

        {user?.role !== 'CUSTOMER' && (
          <button
            className="primary"
            onClick={openCreate}
          >
            <Plus size={17} />
            Create product
          </button>
        )}
      </div>

      {/* FILTERS */}
      <div className="filters panel">
        <div className="search">
          <Search size={18} />

          <input
            placeholder="Search name, SKU, category or vendor"
            value={filters.search}
            onChange={(e) => {
              setPage(1);

              setFilters((f) => ({
                ...f,
                search: e.target.value,
              }));
            }}
          />
        </div>

        <select
          value={filters.categoryId}
          onChange={(e) => {
            setPage(1);

            setFilters((f) => ({
              ...f,
              categoryId: e.target.value,
            }));
          }}
        >
          <option value="">All categories</option>

          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>

        {user?.role === 'ADMIN' && (
          <select
            value={filters.vendorId}
            onChange={(e) => {
              setPage(1);

              setFilters((f) => ({
                ...f,
                vendorId: e.target.value,
              }));
            }}
          >
            <option value="">All vendors</option>

            {vendors.map((v) => (
              <option key={v.id} value={v.id}>
                {v.businessName}
              </option>
            ))}
          </select>
        )}

        <select
          value={filters.status}
          onChange={(e) => {
            setPage(1);

            setFilters((f) => ({
              ...f,
              status: e.target.value,
            }));
          }}
        >
          <option value="">All statuses</option>
          <option>ACTIVE</option>
          <option>INACTIVE</option>
          <option>OUT_OF_STOCK</option>
        </select>

        <select
          value={filters.inStock}
          onChange={(e) => {
            setPage(1);

            setFilters((f) => ({
              ...f,
              inStock: e.target.value,
            }));
          }}
        >
          <option value="">Stock: all</option>
          <option value="true">In stock</option>
          <option value="false">Out of stock</option>
        </select>

        <select
          value={`${filters.sortBy}:${filters.sortOrder}`}
          onChange={(e) => {
            const [sortBy, sortOrder] =
              e.target.value.split(':');

            setFilters((f) => ({
              ...f,
              sortBy,
              sortOrder,
            }));
          }}
        >
          <option value="createdAt:desc">
            Newest
          </option>

          <option value="price:asc">
            Price low → high
          </option>

          <option value="price:desc">
            Price high → low
          </option>

          <option value="name:asc">
            Name A → Z
          </option>
        </select>
      </div>

      {/* ERROR */}
      {error && (
        <div className="error-panel">
          {error}
        </div>
      )}

      {/* PRODUCT TABLE */}
      <div className="table">
        <div className="tr th">
          <span>Product</span>
          <span>Vendor</span>
          <span>Category</span>
          <span>Price</span>
          <span>Stock</span>
          <span>Status</span>
          <span>Actions</span>
        </div>

        {loading ? (
          <div className="empty">
            Loading products…
          </div>
        ) : result.data.length ? (
          result.data.map((p: Product) => {
            const availableQuantity =
              p.inventory?.availableQuantity ?? 0;

            const canBuy =
              p.status === 'ACTIVE' &&
              availableQuantity > 0;

            return (
              <div
                className="tr product-row"
                key={p.id}
              >
                {/* PRODUCT */}
                <span>
                  <b>{p.name}</b>
                  <small>{p.sku}</small>
                </span>

                {/* VENDOR */}
                <span>
                  {p.vendor?.businessName}
                </span>

                {/* CATEGORY */}
                <span>
                  {p.category?.name}
                </span>

                {/* PRICE */}
                <span>
                  {money(p.price)}
                </span>

                {/* STOCK */}
                <span>
                  {availableQuantity}
                </span>

                {/* STATUS */}
                <span>
                  <em>{p.status}</em>
                </span>

                {/* ACTIONS */}
                <span className="actions">
                  {user?.role === 'CUSTOMER' ? (
                    <button
                      className="primary"
                      title={
                        canBuy
                          ? 'Add to cart'
                          : 'Product unavailable'
                      }
                      disabled={!canBuy}
                      onClick={() =>
                        handleAddToCart(p)
                      }
                    >
                      <ShoppingCart size={16} />

                      {canBuy
                        ? 'Add to Cart'
                        : 'Out of Stock'}
                    </button>
                  ) : (
                    <>
                      <button
                        title="Edit"
                        onClick={() =>
                          openEdit(p)
                        }
                      >
                        <Pencil size={16} />
                      </button>

                      <button
                        title="Deactivate"
                        onClick={() =>
                          remove(p.id)
                        }
                      >
                        <Trash2 size={16} />
                      </button>
                    </>
                  )}
                </span>
              </div>
            );
          })
        ) : (
          <div className="empty">
            No products match the current filters.
          </div>
        )}
      </div>

      {/* PAGINATION */}
      <Pagination
        page={result.pagination.page}
        totalPages={result.pagination.totalPages}
        onChange={setPage}
      />

      {/* CREATE / EDIT MODAL */}
      {showForm && (
        <div className="modal-backdrop">
          <form
            className="modal panel"
            onSubmit={submit}
          >
            <div className="modal-head">
              <div>
                <p className="eyebrow">
                  {editing ? 'EDIT' : 'NEW'}
                </p>

                <h3>
                  {editing
                    ? 'Edit product'
                    : 'Create product'}
                </h3>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowForm(false)
                }
              >
                <X />
              </button>
            </div>

            {/* VENDOR */}
            {user?.role === 'ADMIN' && (
              <label>
                Vendor

                <select
                  required
                  value={form.vendorId}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      vendorId:
                        e.target.value,
                    })
                  }
                >
                  <option value="">
                    Select vendor
                  </option>

                  {vendors.map((v) => (
                    <option
                      key={v.id}
                      value={v.id}
                    >
                      {v.businessName}
                    </option>
                  ))}
                </select>
              </label>
            )}

            {/* CATEGORY */}
            <label>
              Category

              <select
                required
                value={form.categoryId}
                onChange={(e) =>
                  setForm({
                    ...form,
                    categoryId:
                      e.target.value,
                  })
                }
              >
                <option value="">
                  Select category
                </option>

                {categories.map((c) => (
                  <option
                    key={c.id}
                    value={c.id}
                  >
                    {c.label}
                  </option>
                ))}
              </select>
            </label>

            {/* NAME */}
            <label>
              Name

              <input
                required
                minLength={2}
                value={form.name}
                onChange={(e) =>
                  setForm({
                    ...form,
                    name: e.target.value,
                  })
                }
              />
            </label>

            {/* SKU */}
            <label>
              SKU

              <input
                required
                disabled={!!editing}
                value={form.sku}
                onChange={(e) =>
                  setForm({
                    ...form,
                    sku: e.target.value,
                  })
                }
              />
            </label>

            {/* PRICE */}
            <label>
              Price

              <input
                required
                type="number"
                min="0.01"
                step="0.01"
                value={form.price}
                onChange={(e) =>
                  setForm({
                    ...form,
                    price: e.target.value,
                  })
                }
              />
            </label>

            {/* DESCRIPTION */}
            <label>
              Description

              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm({
                    ...form,
                    description:
                      e.target.value,
                  })
                }
              />
            </label>

            {/* INITIAL QUANTITY */}
            {!editing && (
              <label>
                Initial quantity

                <input
                  type="number"
                  min="0"
                  value={
                    form.initialQuantity
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      initialQuantity:
                        e.target.value,
                    })
                  }
                />
              </label>
            )}

            {/* STATUS */}
            <label>
              Status

              <select
                value={form.status}
                onChange={(e) =>
                  setForm({
                    ...form,
                    status: e.target.value,
                  })
                }
              >
                <option>ACTIVE</option>
                <option>INACTIVE</option>
                <option>OUT_OF_STOCK</option>
              </select>
            </label>

            <button
              className="primary"
              type="submit"
            >
              {editing
                ? 'Save changes'
                : 'Create product'}
            </button>
          </form>
        </div>
      )}
    </section>
  );
}

function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (n: number) => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="pagination">
      <button
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
      >
        Previous
      </button>

      <span>
        Page {page} of {totalPages}
      </span>

      <button
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
      >
        Next
      </button>
    </div>
  );
}

function flattenCategories(
  nodes: any[],
  prefix = ''
): { id: number; label: string }[] {
  return nodes.flatMap((n) => [
    {
      id: n.id,
      label: `${prefix}${n.name}`,
    },

    ...flattenCategories(
      n.children || [],
      `${prefix}— `
    ),
  ]);
}

function money(value: any) {
  return `₹${Number(value || 0).toLocaleString(
    'en-IN',
    {
      maximumFractionDigits: 2,
    }
  )}`;
}