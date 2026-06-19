import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, Search, Maximize2, Minimize2, X, UserCheck, Play, Pause, Settings } from 'lucide-react';

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
  const [imgAnim,      setImgAnim]      = useState('');

  /* ── Auto-play states ── */
  const [isPlaying,       setIsPlaying]       = useState(false);
  const [playSpeed,       setPlaySpeed]       = useState(1);
  const [animStyle,       setAnimStyle]       = useState('slide');
  const [hasFinishedPlay, setHasFinishedPlay] = useState(false);
  const [showSettings,    setShowSettings]    = useState(false);
  const [loopMode,        setLoopMode]        = useState('finite');
  const [loopCount,       setLoopCount]       = useState(1);
  const [currentLoopIteration, setCurrentLoopIteration] = useState(0);
  const [autoPlayStartedManually, setAutoPlayStartedManually] = useState(false);
  const [touchIndicator,  setTouchIndicator]  = useState(null);

  const hoverTimer   = useRef(null);
  const indicatorTimer = useRef(null);
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
    
    let animClass = '';
    if (animStyle === 'slide') {
      animClass = dir === 'next' ? 'slide-right' : 'slide-left';
    } else if (animStyle === 'fade') {
      animClass = 'fade-in';
    } else if (animStyle === 'zoom') {
      animClass = 'zoom-in';
    } else if (animStyle === 'flip') {
      animClass = 'flip-in';
    } else if (animStyle === 'rotate') {
      animClass = 'rotate-in';
    } else if (animStyle === 'bounce') {
      animClass = 'bounce-in';
    } else if (animStyle === 'blur') {
      animClass = 'blur-in';
    }
    
    setImgAnim(animClass);
    setCurrentIdx(prev =>
      dir === 'next'
        ? (prev + 1) % products.length
        : (prev === 0 ? products.length - 1 : prev - 1)
    );
  };

  /* ── Auto-play Effect ───────────────────────────────── */
  useEffect(() => {
    let timer;
    if (isPlaying && !hasFinishedPlay) {
      const delay = 2000 / playSpeed;
      timer = setTimeout(() => {
        if (currentIdx === products.length - 1) {
          if (loopMode === 'infinite') {
            goTo('next');
          } else {
            const nextIteration = currentLoopIteration + 1;
            if (nextIteration >= loopCount) {
              setIsPlaying(false);
              setHasFinishedPlay(true);
              setCurrentLoopIteration(0); // auto reset
            } else {
              setCurrentLoopIteration(nextIteration);
              goTo('next');
            }
          }
        } else {
          goTo('next');
        }
      }, delay);
    }
    return () => clearTimeout(timer);
  }, [currentIdx, isPlaying, playSpeed, products.length, hasFinishedPlay, animStyle, loopMode, loopCount, currentLoopIteration]);

  /* ── Touch Control Handler ──────────────────────────── */
  const handleVisualizerClick = (e) => {
    if (autoPlayStartedManually) {
      const newIsPlaying = !isPlaying;
      setIsPlaying(newIsPlaying);
      setTouchIndicator(newIsPlaying ? 'play' : 'pause');
      clearTimeout(indicatorTimer.current);
      indicatorTimer.current = setTimeout(() => setTouchIndicator(null), 800);
      
      if (newIsPlaying && hasFinishedPlay) {
        setHasFinishedPlay(false);
        setCurrentIdx(0);
        setCurrentLoopIteration(0);
      }
    }
  };

  const startAutoPlayManually = () => {
    setAutoPlayStartedManually(true);
    const willPlay = !isPlaying;
    setIsPlaying(willPlay);
    if (willPlay && hasFinishedPlay) {
      setHasFinishedPlay(false);
      setCurrentIdx(0);
      setCurrentLoopIteration(0);
    }
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
      onClick={handleVisualizerClick}
      ref={containerRef}
    >
      {touchIndicator && (
        <div className="ap-touch-indicator">
          {touchIndicator === 'play' ? <Play size={64} fill="white" /> : <Pause size={64} fill="white" />}
        </div>
      )}
      <button
        className={`nav-arrow left dv-arrow${arrowVisible || isPlaying ? ' dv-arrow-visible' : ''}`}
        onClick={(e) => { e.stopPropagation(); prevProduct(); }}
        aria-label="Previous Product"
      >
        <ChevronLeft size={40} />
      </button>

      <div className="dv-img-frame">
        {currentProduct ? (
          <img
            key={currentProduct.id}
            src={clImg(currentProduct.link, 730)}
            alt={currentProduct.name}
            className={`dv-product-img${imgAnim ? ` dv-${imgAnim}` : ''}`}
            width="730"
            height="730"
          />
        ) : (
          <div className="dv-no-products">
            <p>No products linked to this doctor.</p>
          </div>
        )}
      </div>

      <button
        className={`nav-arrow right dv-arrow${arrowVisible || isPlaying ? ' dv-arrow-visible' : ''}`}
        onClick={(e) => { e.stopPropagation(); nextProduct(); }}
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
        {doctor.visitDay && <span className="dp-grade-badge" style={{ background: '#e0e7ff', color: '#3730a3' }}>{doctor.visitDay}</span>}
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
      <div className="dv-vis-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {Visualizer}
        <button className="dv-expand-btn" onClick={() => {
          setFullscreen(true);
          // Preload next 2 images
          const next1 = products[(currentIdx + 1) % products.length];
          const next2 = products[(currentIdx + 2) % products.length];
          if (next1) { const img = new Image(); img.src = clImg(next1.link, 730); }
          if (next2) { const img = new Image(); img.src = clImg(next2.link, 730); }
        }} title="Fullscreen">
          <Maximize2 size={20} />
        </button>

        {/* Settings Toggle & Controls */}
        <div className="ap-settings-container">
          <button className="ap-settings-toggle" onClick={() => setShowSettings(!showSettings)}>
            <Settings size={18} /> Settings
          </button>
          
          {showSettings && (
            <div className="ap-controls">
              <button className="ap-btn" onClick={startAutoPlayManually} title={isPlaying ? "Pause" : "Play"}>
                {isPlaying ? <Pause size={18} /> : <Play size={18} />}
              </button>
              <select className="ap-select" value={playSpeed} onChange={(e) => setPlaySpeed(Number(e.target.value))}>
                <option value="0.25">0.25x</option>
                <option value="0.5">0.5x</option>
                <option value="1">1x</option>
                <option value="1.25">1.25x</option>
                <option value="1.5">1.5x</option>
                <option value="2">2x</option>
                <option value="2.5">2.5x</option>
              </select>
              <select className="ap-select" value={animStyle} onChange={(e) => setAnimStyle(e.target.value)}>
                <option value="slide">Slide</option>
                <option value="fade">Fade</option>
                <option value="zoom">Zoom</option>
                <option value="flip">Flip</option>
                <option value="rotate">Rotate</option>
                <option value="bounce">Bounce</option>
                <option value="blur">Blur</option>
              </select>
              <select className="ap-select" value={loopMode} onChange={(e) => {
                setLoopMode(e.target.value);
                setCurrentLoopIteration(0);
              }}>
                <option value="finite">Finite Loop</option>
                <option value="infinite">Infinite Loop</option>
              </select>
              {loopMode === 'finite' && (
                <select className="ap-select" value={loopCount} onChange={(e) => {
                  setLoopCount(Number(e.target.value));
                  setCurrentLoopIteration(0);
                }}>
                  <option value={1}>1 Time</option>
                  <option value={2}>2 Times</option>
                  <option value={3}>3 Times</option>
                  <option value={4}>4 Times</option>
                  <option value={5}>5 Times</option>
                  <option value={10}>10 Times</option>
                </select>
              )}
            </div>
          )}
        </div>

        {/* End of Play Overlay */}
        {hasFinishedPlay && !fullscreen && (
          <div className="ap-end-overlay">
            <h2 className="ap-end-title">Visualization Complete</h2>
            <div className="ap-end-actions">
              <button className="ap-end-btn ap-btn-home" onClick={() => {
                setHasFinishedPlay(false);
                setCurrentIdx(0);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}>
                Back to Start
              </button>
              <button className="ap-end-btn ap-btn-again" onClick={() => {
                setHasFinishedPlay(false);
                setCurrentIdx(0);
                setIsPlaying(true);
              }}>
                Play Again
              </button>
            </div>
          </div>
        )}
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
            onClick={handleVisualizerClick}
          >
            {touchIndicator && (
              <div className="ap-touch-indicator">
                {touchIndicator === 'play' ? <Play size={64} fill="white" /> : <Pause size={64} fill="white" />}
              </div>
            )}
            <button className={`nav-arrow left dv-arrow${arrowVisible || isPlaying ? ' dv-arrow-visible' : ''}`}
              onClick={(e) => { e.stopPropagation(); prevProduct(); }} aria-label="Previous">
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
            <button className={`nav-arrow right dv-arrow${arrowVisible || isPlaying ? ' dv-arrow-visible' : ''}`}
              onClick={(e) => { e.stopPropagation(); nextProduct(); }} aria-label="Next">
              <ChevronRight size={48} />
            </button>
          </div>

          <div className="ap-settings-container" style={{ position: 'absolute', top: '1rem', left: '1rem', zIndex: 30, width: 'auto', alignItems: 'flex-start' }}>
            <button className="ap-settings-toggle" onClick={() => setShowSettings(!showSettings)}>
              <Settings size={18} />
            </button>
            
            {showSettings && (
              <div className="ap-controls">
                <button className="ap-btn" onClick={startAutoPlayManually}>
                  {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                </button>
                <select className="ap-select" value={playSpeed} onChange={(e) => setPlaySpeed(Number(e.target.value))}>
                  <option value="0.25">0.25x</option>
                  <option value="0.5">0.5x</option>
                  <option value="1">1x</option>
                  <option value="1.25">1.25x</option>
                  <option value="1.5">1.5x</option>
                  <option value="2">2x</option>
                  <option value="2.5">2.5x</option>
                </select>
                <select className="ap-select" value={animStyle} onChange={(e) => setAnimStyle(e.target.value)}>
                  <option value="slide">Slide</option>
                  <option value="fade">Fade</option>
                  <option value="zoom">Zoom</option>
                  <option value="flip">Flip</option>
                  <option value="rotate">Rotate</option>
                  <option value="bounce">Bounce</option>
                  <option value="blur">Blur</option>
                </select>
                <select className="ap-select" value={loopMode} onChange={(e) => {
                  setLoopMode(e.target.value);
                  setCurrentLoopIteration(0);
                }}>
                  <option value="finite">Finite Loop</option>
                  <option value="infinite">Infinite Loop</option>
                </select>
                {loopMode === 'finite' && (
                  <select className="ap-select" value={loopCount} onChange={(e) => {
                    setLoopCount(Number(e.target.value));
                    setCurrentLoopIteration(0);
                  }}>
                    <option value={1}>1 Time</option>
                    <option value={2}>2 Times</option>
                    <option value={3}>3 Times</option>
                    <option value={4}>4 Times</option>
                    <option value={5}>5 Times</option>
                    <option value={10}>10 Times</option>
                  </select>
                )}
              </div>
            )}
          </div>
          
          {hasFinishedPlay && (
            <div className="ap-end-overlay">
              <h2 className="ap-end-title">Visualization Complete</h2>
              <div className="ap-end-actions">
                <button className="ap-end-btn ap-btn-home" onClick={() => {
                  setHasFinishedPlay(false);
                  setCurrentIdx(0);
                  setFullscreen(false);
                }}>
                  Close Fullscreen
                </button>
                <button className="ap-end-btn ap-btn-again" onClick={() => {
                  setHasFinishedPlay(false);
                  setCurrentIdx(0);
                  setIsPlaying(true);
                }}>
                  Play Again
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default DoctorDetailPage;
