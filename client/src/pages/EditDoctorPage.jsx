import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Edit3, Search, Download, Plus, Trash2, Save, CheckCircle, GripVertical } from 'lucide-react';

const CLOUDINARY_BASE = "https://res.cloudinary.com/dpsq08nun/image/upload";
const clImg = (src, w) => {
  const transforms = w ? `f_auto,q_auto,w_${w}` : 'f_auto,q_auto';
  if (src && src.startsWith(CLOUDINARY_BASE)) {
    return src.replace('/image/upload/', `/image/upload/${transforms}/`);
  }
  return src;
};



function EditDoctorPage({ navigateTo, BACKEND_URL }) {
  /* ── State ─────────────────────────────────────────────────── */
  const [allDoctors,    setAllDoctors]    = useState([]);
  const [allProducts,   setAllProducts]   = useState([]);
  const [query,         setQuery]         = useState('');
  const [suggestions,   setSuggestions]   = useState([]);
  const [showSug,       setShowSug]       = useState(false);
  const [selectedDoc,   setSelectedDoc]   = useState(null);  // full doctor object
  const [docProducts,   setDocProducts]   = useState([]);    // linked products
  const [fetching,      setFetching]      = useState(false);
  const [selectedProd,  setSelectedProd]  = useState('');    // product _id from dropdown
  const [adding,        setAdding]        = useState(false);
  const [addError,      setAddError]      = useState('');
  const [removing,      setRemoving]      = useState('');    // productId being removed
  const [saved,         setSaved]         = useState(false);
  const [confirmed,     setConfirmed]     = useState(false); // checkbox

  const [prodQuery,     setProdQuery]     = useState('');
  const [prodSuggestions, setProdSuggestions] = useState([]);
  const [showProdSug,   setShowProdSug]   = useState(false);

  const sugRef = useRef(null);
  const prodSugRef = useRef(null);
  const dragItem = useRef(null);
  const dragOverItem = useRef(null);

  /* ── Fetch doctors & products on mount ─────────────────────── */
  useEffect(() => {
    Promise.all([
      fetch(`${BACKEND_URL}/api/doctors`).then(r => r.json()),
      fetch(`${BACKEND_URL}/api/vizulate-products`).then(r => r.json()),
    ]).then(([docs, prods]) => {
      setAllDoctors(Array.isArray(docs)  ? docs  : []);
      setAllProducts(Array.isArray(prods) ? prods : []);
    }).catch(console.error);
  }, [BACKEND_URL]);

  /* ── Click outside to close suggestions ────────────────────── */
  useEffect(() => {
    const handler = e => { 
      if (sugRef.current && !sugRef.current.contains(e.target)) setShowSug(false); 
      if (prodSugRef.current && !prodSugRef.current.contains(e.target)) setShowProdSug(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* ── Doctor search suggestions ──────────────────────────────── */
  const handleQueryChange = e => {
    const val = e.target.value;
    setQuery(val);
    setSelectedDoc(null);
    if (val.trim().length > 0) {
      const filtered = allDoctors.filter(d =>
        d.name.toLowerCase().includes(val.toLowerCase())
      );
      setSuggestions(filtered);
      setShowSug(true);
    } else {
      setShowSug(false);
    }
  };

  const selectDoctor = doc => {
    setQuery(doc.name);
    setSelectedDoc(doc);
    setDocProducts(doc.products || []);
    setShowSug(false);
    setSaved(false);
    setConfirmed(false);
    setAddError('');
  };

  /* ── Product search suggestions ────────────────────────────── */
  const handleProdQueryChange = e => {
    const val = e.target.value;
    setProdQuery(val);
    setSelectedProd('');
    if (val.trim().length > 0) {
      const linkedIds = new Set(docProducts.map(dp => dp.id));
      const filtered = allProducts
        .filter(p => !linkedIds.has(p._id))
        .filter(p => p.name.toLowerCase().includes(val.toLowerCase()));
      setProdSuggestions(filtered.slice(0, 30));
      setShowProdSug(true);
    } else {
      setShowProdSug(false);
    }
  };

  const selectProduct = prod => {
    setProdQuery(prod.name);
    setSelectedProd(prod._id);
    setShowProdSug(false);
    setAddError('');
  };

  /* ── Fetch latest doctor info ───────────────────────────────── */
  const fetchDoctorInfo = async () => {
    if (!selectedDoc) return;
    setFetching(true);
    try {
      const res  = await fetch(`${BACKEND_URL}/api/doctors/${selectedDoc._id}`);
      const data = await res.json();
      setSelectedDoc(data);
      setDocProducts(data.products || []);
    } catch (err) {
      console.error(err);
    } finally {
      setFetching(false);
    }
  };

  /* ── Add product ────────────────────────────────────────────── */
  const handleAddProduct = async () => {
    if (!selectedProd) { setAddError('Please select a product first.'); return; }
    const prod = allProducts.find(p => p._id === selectedProd);
    if (!prod) return;

    setAdding(true);
    setAddError('');
    try {
      const res = await fetch(`${BACKEND_URL}/api/doctors/${selectedDoc._id}/products`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ id: prod._id, name: prod.name, link: prod.link }),
      });
      if (res.status === 409) { setAddError('This product is already linked to this doctor.'); return; }
      if (!res.ok) throw new Error('Failed to add product');
      const updated = await res.json();
      setDocProducts(updated.products || []);
      setSelectedProd('');
      setProdQuery('');
    } catch (err) {
      setAddError(err.message);
    } finally {
      setAdding(false);
    }
  };

  /* ── Remove product ─────────────────────────────────────────── */
  const handleRemoveProduct = async (productId) => {
    setRemoving(productId);
    try {
      const res = await fetch(`${BACKEND_URL}/api/doctors/${selectedDoc._id}/products/${productId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to remove product');
      const updated = await res.json();
      setDocProducts(updated.products || []);
    } catch (err) {
      console.error(err);
    } finally {
      setRemoving('');
    }
  };

  /* ── Reorder products (Drag & Drop) ─────────────────────────── */
  const handleSort = async () => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    if (dragItem.current === dragOverItem.current) {
      dragItem.current = null;
      dragOverItem.current = null;
      return;
    }

    const _docProducts = [...docProducts];
    const draggedItem = _docProducts.splice(dragItem.current, 1)[0];
    _docProducts.splice(dragOverItem.current, 0, draggedItem);

    dragItem.current = null;
    dragOverItem.current = null;
    setDocProducts(_docProducts);

    // Persist to backend
    try {
      const res = await fetch(`${BACKEND_URL}/api/doctors/${selectedDoc._id}/products/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products: _docProducts }),
      });
      if (!res.ok) {
        const errData = await res.json();
        console.error('Reorder save failed:', errData.error);
      }
    } catch (err) {
      console.error('Failed to save new order', err);
    }
  };

  /* ── Save (navigate back) ───────────────────────────────────── */
  const handleSave = () => {
    setSaved(true);
    setTimeout(() => navigateTo('doctors'), 1500);
  };

  /* ── Render ─────────────────────────────────────────────────── */
  if (saved) {
    return (
      <div className="nd-success">
        <CheckCircle size={64} className="nd-success-icon" />
        <h2>Changes Saved!</h2>
        <p>Redirecting to Doctors page…</p>
      </div>
    );
  }

  return (
    <div className="ed-page">
      {/* Header */}
      <div className="dd-header">
        <button className="nd-back-btn" onClick={() => navigateTo('doctors')}>
          <ArrowLeft size={18} /> Back to Doctors
        </button>
        <div className="nd-title">
          <Edit3 size={26} />
          <h2>Add / Edit Doctor Products</h2>
        </div>
      </div>

      {/* ── Step 1: Select Doctor ── */}
      <div className="ed-section">
        <h3 className="ed-section-title">Select Doctor</h3>
        <div className="ed-doctor-search" ref={sugRef}>
          <div className="ed-search-row">
            <div className="ed-search-input-wrap">
              <Search size={16} className="ed-search-icon" />
              <input
                type="text"
                className="nd-input ed-search-input"
                placeholder="Type doctor name…"
                value={query}
                onChange={handleQueryChange}
                onFocus={() => query && setShowSug(true)}
                autoComplete="off"
              />
            </div>
            <button
              className="ed-fetch-btn"
              onClick={fetchDoctorInfo}
              disabled={!selectedDoc || fetching}
            >
              {fetching ? <span className="nd-btn-spinner" /> : <Download size={16} />}
              Fetch
            </button>
          </div>

          {showSug && suggestions.length > 0 && (
            <div className="ed-suggestions">
              {suggestions.map(d => (
                <div key={d._id} className="ed-suggestion-item" onClick={() => selectDoctor(d)}>
                  <span className="ed-sug-avatar">{d.name.charAt(0)}</span>
                  <div>
                    <p className="ed-sug-name">{d.name}</p>
                    <p className="ed-sug-meta">{d.degreeType} · {d.city}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Doctor Info Card */}
        {selectedDoc && (
          <div className="ed-doctor-card">
            <div className="ed-doctor-card-avatar">{selectedDoc.name.charAt(0)}</div>
            <div className="ed-doctor-card-info">
              <h4>{selectedDoc.name}</h4>
              <p>{selectedDoc.degreeType}{selectedDoc.specialization ? ` (${selectedDoc.specialization})` : ''} · Grade {selectedDoc.grade}</p>
              <p>📍 {selectedDoc.city}, {selectedDoc.state}</p>
              <p>📞 {selectedDoc.phone}</p>
              <p>🗓️ Visit Day: {selectedDoc.visitDay || 'Not specified'}</p>
              {selectedDoc.email && <p>✉️ {selectedDoc.email}</p>}
            </div>
          </div>
        )}
      </div>

      {/* ── Step 2: Add / Edit Products (only after a doctor is selected) ── */}
      {selectedDoc && (
        <>
          {/* Subsection 1 – Add Product */}
          <div className="ed-section">
            <h3 className="ed-section-title">Add Product</h3>
            <p className="ed-section-hint">
              Search for a product below and click Add to link it to this doctor.
            </p>
            <div className="ed-add-product-row" ref={prodSugRef} style={{ position: 'relative' }}>
              <div className="ed-search-input-wrap" style={{ flex: 1 }}>
                <Search size={16} className="ed-search-icon" />
                <input
                  type="text"
                  className="nd-input ed-search-input"
                  placeholder="Type product name to search…"
                  value={prodQuery}
                  onChange={handleProdQueryChange}
                  onFocus={() => prodQuery && setShowProdSug(true)}
                  autoComplete="off"
                />
              </div>
              <button className="ed-add-btn" onClick={handleAddProduct} disabled={adding || !selectedProd}>
                {adding ? <span className="nd-btn-spinner" /> : <Plus size={16} />}
                Add Product
              </button>

              {showProdSug && prodSuggestions.length > 0 && (
                <div className="ed-suggestions" style={{ top: 'calc(100% + 6px)' }}>
                  {prodSuggestions.map(p => (
                    <div key={p._id} className="ed-suggestion-item" onClick={() => selectProduct(p)}>
                      <img src={clImg(p.link, 80)} alt={p.name} className="ed-sug-avatar" style={{ borderRadius: 4, objectFit: 'cover' }} loading="lazy" />
                      <div>
                        <p className="ed-sug-name">{p.name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {addError && <span className="nd-error">{addError}</span>}
          </div>

          {/* Subsection 2 – Linked Products */}
          <div className="ed-section">
            <h3 className="ed-section-title">
              Added Products
              <span className="dp-count-badge" style={{marginLeft:'0.75rem'}}>{docProducts.length}</span>
            </h3>
            {docProducts.length === 0 ? (
              <p className="ed-empty-products">No products linked yet. Add one above.</p>
            ) : (
              <div className="ed-product-list">
                {docProducts.map((prod, index) => (
                  <div
                    key={prod.id}
                    className="ed-product-item"
                    draggable
                    onDragStart={() => (dragItem.current = index)}
                    onDragEnter={() => (dragOverItem.current = index)}
                    onDragEnd={handleSort}
                    onDragOver={(e) => e.preventDefault()}
                  >
                    <div className="ed-drag-handle" title="Drag to reorder">
                      <GripVertical size={20} />
                    </div>
                    <img
                      src={clImg(prod.link, 100)}
                      alt={prod.name}
                      className="ed-product-thumb"
                      loading="lazy"
                    />
                    <div className="ed-product-details">
                      <p className="ed-product-name">{prod.name}</p>
                      <p className="ed-product-id" title={prod.id}>ID: {prod.id.slice(0,12)}…</p>
                    </div>
                    <button
                      className="ed-remove-btn"
                      onClick={() => handleRemoveProduct(prod.id)}
                      disabled={removing === prod.id}
                      title="Remove product"
                    >
                      {removing === prod.id ? <span className="nd-btn-spinner" /> : <Trash2 size={15} />}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Save */}
          <div className="ed-save-section">
            <label className="ed-confirm-check">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={e => setConfirmed(e.target.checked)}
              />
              I confirm all changes are correct.
            </label>
            <button
              className="ed-save-btn"
              onClick={handleSave}
              disabled={!confirmed}
            >
              <Save size={18} /> Save &amp; Go Back
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default EditDoctorPage;
