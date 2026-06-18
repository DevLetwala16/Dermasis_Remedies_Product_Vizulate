import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, Search, Maximize2, Minimize2, X, UserCheck } from 'lucide-react';

const CLOUDINARY_BASE = 'https://res.cloudinary.com/dpsq08nun/image/upload';

const clImg = (src, w) => {
  const transforms = w ? `f_auto,q_auto,w_${w}` : 'f_auto,q_auto';
  if (src && src.startsWith(CLOUDINARY_BASE)) {
    return src.replace('/image/upload/', `/image/upload/${transforms}/`);
  }
  return src;
};

function DoctorDetailPage({ navigateTo, BACKEND_URL, doctorId }) {
  const [doctor,       setDoctor]       = useState(null);
  const [products,     setProducts]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [currentIdx,   setCurrentIdx]   = useState(0);
  const [searchQuery,  setSearchQuery]  = useState('');
  const [showSug,      setShowSug]      = useState(false);
  const [arrowVisible, setArrowVisible] = useState(false);
  const [fullscreen,   setFullscreen]   = useState(false);
  const [touchStart,   setTouchStart]   = useState(null);
  const [touchEnd,     setTouchEnd]     = useState(null);
  const [imgAnim,      setImgAnim]      = useState('');  // 'slide-left' | 'slide-right'

  const hoverTimer   = useRef(null);
  const searchRef    = useRef(null);
  const containerRef = useRef(null);

  /* ── Fetch doctor ──────────────────────────────────────────── */
  useEffect(() => {
    if (!doctorId) { navigateTo('doctors'); return; }
    const load = async () => {
      setLoading(true);
      try {
        const res  = await fetch(`${BACKEND_URL}/api/doctors/${doctorId}`);
        const data = await res.json();
        setDoctor(data);
        setProducts(data.products || []);
        // Preload images
        (data.products || []).forEach(p => {
          const img = new Image();
          img.src = clImg(p.link, 900);
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [doctorId, BACKEND_URL]);

  /* ── Click outside search ──────────────────────────────────── */
  useEffect(() => {
    const h = e => { if (searchRef.current && !searchRef.current.contains(e.target)) setShowSug(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  /* ── Fullscreen ESC ────────────────────────────────────────── */
  useEffect(() => {
    const h = e => { if (e.key === 'Escape') setFullscreen(false); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  /* ── Filter for search suggestions ────────────────────────── */
  const filteredSug = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const goTo = (dir) => {
    if (products.length === 0) return;
    setImgAnim(dir === 'next' ? 'slide-right' : 'slide-left');
    setCurrentIdx(prev =>
      dir === 'next'
        ? (prev + 1) % products.length
        : (prev === 0 ? products.length - 1 : prev - 1)
    );
  };

  const nextProduct = () => goTo('next');
  const prevProduct = () => goTo('prev');

  /* ── Swipe ─────────────────────────────────────────────────── */
  const minSwipe = 50;
  const onTouchStart = e => { setTouchEnd(null); setTouchStart(e.targetTouches[0].clientX); };
  const onTouchMove  = e => setTouchEnd(e.targetTouches[0].clientX);
  const onTouchEnd   = () => {
    if (!touchStart || !touchEnd) return;
    const dist = touchStart - touchEnd;
    if (dist >  minSwipe) nextProduct();
    if (dist < -minSwipe) prevProduct();
  };

  /* ── Arrow hover ────────────────────────────────────────────── */
  const showArrows = () => {
    clearTimeout(hoverTimer.current);
    setArrowVisible(true);
    hoverTimer.current = setTimeout(() => setArrowVisible(false), 2500);
  };

  /* ── Suggestion click ───────────────────────────────────────── */
  const handleSugClick = (prod) => {
    const idx = products.findIndex(p => p.id === prod.id);
    if (idx !== -1) setCurrentIdx(idx);
    setSearchQuery('');
    setShowSug(false);
  };

  const currentProduct = products[currentIdx];

  /* ── Loading ────────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="dp-loading" style={{ minHeight: '60vh' }}>
        <div className="dp-spinner" />
        <p>Loading doctor info…</p>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="dp-empty">
        <p>Doctor not found.</p>
        <button className="dp-btn dp-btn-new" onClick={() => navigateTo('doctors')}>Go Back</button>
      </div>
    );
  }

  const Visualizer = (
    <div className="dv-visualizer-wrap"
      onMouseMove={showArrows}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      ref={containerRef}
    >
      <button
        className={`nav-arrow left dv-arrow${arrowVisible ? ' dv-arrow-visible' : ''}`}
        onClick={prevProduct}
        aria-label="Previous Product"
      >
        <ChevronLeft size={40} />
      </button>

      <div className="dv-img-frame">
        {currentProduct ? (
          <img
            key={currentProduct.id}
            src={clImg(currentProduct.link, 900)}
            alt={currentProduct.name}
            className={`dv-product-img${imgAnim ? ` dv-${imgAnim}` : ''}`}
            width="900"
            height="900"
          />
        ) : (
          <div className="dv-no-products">
            <p>No products linked to this doctor.</p>
          </div>
        )}
      </div>

      <button
        className={`nav-arrow right dv-arrow${arrowVisible ? ' dv-arrow-visible' : ''}`}
        onClick={nextProduct}
        aria-label="Next Product"
      >
        <ChevronRight size={40} />
      </button>
    </div>
  );

  return (
    <div className="dv-page">

      {/* Back */}
      <button className="nd-back-btn dv-back" onClick={() => navigateTo('home')}>
        <ArrowLeft size={18} /> Back to Home
      </button>

      {/* Doctor Info */}
      <div className="dv-doctor-info">
        <div className="dv-doc-avatar">{doctor.name.charAt(0).toUpperCase()}</div>
        <div>
          <h2 className="dv-doc-name">{doctor.name}</h2>
          <p className="dv-doc-meta">{doctor.degreeType} · {doctor.city}</p>
        </div>
        <span className="dp-grade-badge">Grade {doctor.grade}</span>
      </div>

      {/* Product name */}
      {currentProduct && (
        <div className="product-info" style={{ marginTop: '1rem', marginBottom: '0' }}>
          {/* <h1 className="product-name">{currentProduct.name}</h1> */}
          <p className="dv-counter">
            {currentIdx + 1} / {products.length}
          </p>
        </div>
      )}

      {/* Search Bar */}
      <div className="search-wrapper dv-search" ref={searchRef}>
        <div className="search-input-container">
          <Search className="search-icon" size={20} />
          <input
            type="text"
            className="search-input"
            placeholder="Search products by name…"
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setShowSug(e.target.value.length > 0); }}
            onFocus={() => setShowSug(searchQuery.length > 0)}
          />
        </div>
        {showSug && filteredSug.length > 0 && (
          <div className="search-suggestions active">
            {filteredSug.map(p => (
              <div key={p.id} className="suggestion-item" onClick={() => handleSugClick(p)}>
                <img src={clImg(p.link, 80)} alt={p.name} className="suggestion-img" width="40" height="40" loading="lazy" />
                <span>{p.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Visualizer + Expand button */}
      <div className="dv-vis-container">
        {Visualizer}
        <button className="dv-expand-btn" onClick={() => setFullscreen(true)} title="Fullscreen">
          <Maximize2 size={20} />
        </button>
      </div>

      {/* Fullscreen Overlay */}
      {fullscreen && (
        <div className="dv-fullscreen-overlay">
          <button className="dv-fs-close" onClick={() => setFullscreen(false)}>
            <X size={28} />
          </button>
          {/* <div className="dv-fs-name">{currentProduct?.name}</div> */}
          <div className="dv-fs-counter">{currentIdx + 1} / {products.length}</div>

          <div className="dv-visualizer-wrap dv-fs-vis"
            onMouseMove={showArrows}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            <button className={`nav-arrow left dv-arrow${arrowVisible ? ' dv-arrow-visible' : ''}`}
              onClick={prevProduct} aria-label="Previous">
              <ChevronLeft size={48} />
            </button>
            {currentProduct && (
              <img
                key={`fs-${currentProduct.id}`}
                src={clImg(currentProduct.link, 1200)}
                alt={currentProduct.name}
                className={`dv-product-img dv-fs-img${imgAnim ? ` dv-${imgAnim}` : ''}`}
              />
            )}
            <button className={`nav-arrow right dv-arrow${arrowVisible ? ' dv-arrow-visible' : ''}`}
              onClick={nextProduct} aria-label="Next">
              <ChevronRight size={48} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DoctorDetailPage;
