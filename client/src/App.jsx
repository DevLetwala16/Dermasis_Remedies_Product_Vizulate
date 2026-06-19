import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronLeft, ChevronRight, Mail, MapPin, Phone, Eye, ChevronDown, Users, Maximize2, X, Play, Pause, Settings, Menu } from 'lucide-react';
import './index.css';
const DoctorsPage = React.lazy(() => import('./pages/DoctorsPage.jsx'));
const NewDoctorPage = React.lazy(() => import('./pages/NewDoctorPage.jsx'));
const DeleteDoctorPage = React.lazy(() => import('./pages/DeleteDoctorPage.jsx'));
const EditDoctorPage = React.lazy(() => import('./pages/EditDoctorPage.jsx'));
const EditDoctorInfoPage = React.lazy(() => import('./pages/EditDoctorInfoPage.jsx'));
const DoctorDetailPage = React.lazy(() => import('./pages/DoctorDetailPage.jsx'));
const ContactPage = React.lazy(() => import('./pages/ContactPage.jsx'));

// ── Cloudinary helpers ───────────────────────────────────────────────────────
const CLOUDINARY_BASE = "https://res.cloudinary.com/dpsq08nun/image/upload";
const LOGO_VERSION    = "v1777359495/IMG-20260407-WA0000_eyvt70.jpg";

const clImg = (src, w) => {
  const transforms = w ? `f_auto,q_auto,w_${w}` : 'f_auto,q_auto';
  if (src && src.startsWith(CLOUDINARY_BASE)) {
    return src.replace('/image/upload/', `/image/upload/${transforms}/`);
  }
  return src;
};

const LOGO_URL = `${CLOUDINARY_BASE}/f_auto,q_auto,w_300/${LOGO_VERSION}`;

const BACKEND_URL = window.location.hostname === "localhost"
  ? "http://localhost:5000"
  : "https://dermasis-remedies-product-vizulate.onrender.com";

const API_URL = `${BACKEND_URL}/api/vizulate-products`;

// ── App ──────────────────────────────────────────────────────────────────────
function App() {
  /* ── Home-page state ────────────────────────────────── */
  const [loading,         setLoading]         = useState(true);
  const [products,        setProducts]        = useState([]);
  const [searchQuery,     setSearchQuery]     = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [currentIndex,    setCurrentIndex]    = useState(0);
  const [touchStart,      setTouchStart]      = useState(null);
  const [touchEnd,        setTouchEnd]        = useState(null);

  /* ── New Feature state ──────────────────────────────── */
  const [fullscreen,      setFullscreen]      = useState(false);
  const [imgAnim,         setImgAnim]         = useState('');
  const [isPlaying,       setIsPlaying]       = useState(false);
  const [playSpeed,       setPlaySpeed]       = useState(1);
  const [animStyle,       setAnimStyle]       = useState('slide');
  const [hasFinishedPlay, setHasFinishedPlay] = useState(false);
  const [arrowVisible,    setArrowVisible]    = useState(false);
  const [showSettings,    setShowSettings]    = useState(false);
  
  const [loopMode,        setLoopMode]        = useState('finite'); // 'finite' or 'infinite'
  const [loopCount,       setLoopCount]       = useState(1);
  const [currentLoopIteration, setCurrentLoopIteration] = useState(0);
  const [autoPlayStartedManually, setAutoPlayStartedManually] = useState(false);
  const [touchIndicator,  setTouchIndicator]  = useState(null); // 'play' or 'pause'
  
  const hoverTimer = useRef(null);
  const indicatorTimer = useRef(null);

  /* ── Routing state ──────────────────────────────────── */
  const [page,       setPage]       = useState('home');  // 'home'|'doctors'|'new-doctor'|'delete-doctor'|'edit-doctor'|'doctor-detail'
  const [routeParams, setRouteParams] = useState({});

  /* ── Doctors nav dropdown ───────────────────────────── */
  const [docDropOpen, setDocDropOpen] = useState(false);
  const dropRef = useRef(null);

  const searchRef = useRef(null);

  // ── Mobile Menu State ──────────────────────────────
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // ── Navigate helper ──────────────────────────────────
  const navigateTo = (targetPage, params = {}) => {
    setPage(targetPage);
    setRouteParams(params);
    setDocDropOpen(false);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Fetch main products ──────────────────────────────
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(API_URL);
        if (response.ok) {
          const data = await response.json();
          setProducts(data);
          data.forEach(product => {
            const img = new Image();
            img.src = clImg(product.link, 730);
          });
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setTimeout(() => setLoading(false), 2000);
      }
    };
    fetchData();
  }, []);

  // ── Close search on outside click ───────────────────
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ── Close dropdown on outside click ─────────────────
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) {
        setDocDropOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ── Search filter ────────────────────────────────────
  const filteredSuggestions = products.filter(
    (product) => product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSuggestionClick = (product) => {
    const index = products.findIndex(p => p._id === product._id);
    if (index !== -1) {
      setCurrentIndex(index);
      setSearchQuery('');
      setShowSuggestions(false);
    }
  };

  // ── Product navigation ───────────────────────────────
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
    setCurrentIndex(prev =>
      dir === 'next'
        ? (prev + 1) % products.length
        : (prev === 0 ? products.length - 1 : prev - 1)
    );
  };

  const nextProduct = () => goTo('next');
  const prevProduct = () => goTo('prev');

  const showArrows = () => {
    clearTimeout(hoverTimer.current);
    setArrowVisible(true);
    hoverTimer.current = setTimeout(() => setArrowVisible(false), 2500);
  };

  // ── Auto-play Effect ─────────────────────────────────
  useEffect(() => {
    let timer;
    if (isPlaying && !hasFinishedPlay) {
      const delay = 2000 / playSpeed;
      timer = setTimeout(() => {
        if (currentIndex === products.length - 1) {
          if (loopMode === 'infinite') {
            goTo('next');
          } else {
            const nextIteration = currentLoopIteration + 1;
            if (nextIteration >= loopCount) {
              setIsPlaying(false);
              setHasFinishedPlay(true);
              setCurrentLoopIteration(0); // auto reset for next play
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
  }, [currentIndex, isPlaying, playSpeed, products.length, hasFinishedPlay, animStyle, loopMode, loopCount, currentLoopIteration]);

  // ── Touch Control Handler ────────────────────────────
  const handleVisualizerClick = (e) => {
    if (autoPlayStartedManually) {
      const newIsPlaying = !isPlaying;
      setIsPlaying(newIsPlaying);
      setTouchIndicator(newIsPlaying ? 'play' : 'pause');
      clearTimeout(indicatorTimer.current);
      indicatorTimer.current = setTimeout(() => setTouchIndicator(null), 800);
      
      // If it was finished and they click the visualizer to play again
      if (newIsPlaying && hasFinishedPlay) {
        setHasFinishedPlay(false);
        setCurrentIndex(0);
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
      setCurrentIndex(0);
      setCurrentLoopIteration(0);
    }
  };

  // ── Swipe handlers ───────────────────────────────────
  const minSwipeDistance = 50;
  const onTouchStart = (e) => { setTouchEnd(null); setTouchStart(e.targetTouches[0].clientX); };
  const onTouchMove  = (e) => setTouchEnd(e.targetTouches[0].clientX);
  const onTouchEnd   = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (distance >  minSwipeDistance) nextProduct();
    if (distance < -minSwipeDistance) prevProduct();
  };

  // ── Loading screen ───────────────────────────────────
  if (loading) {
    return (
      <div className="loading-screen">
        <img src={LOGO_URL} alt="Dermasis Remedies Loading..." className="loading-logo"
          width="300" height="300" fetchpriority="high" />
        <p className="loading-text">LOADING ...</p>
      </div>
    );
  }

  const currentProduct = products[currentIndex];

  // ── Shared Header ────────────────────────────────────
  const Header = (
    <header className="header">
      <div className="header-top">
        <div className="header-brand">
          <img src={LOGO_URL} alt="Dermasis Logo" className="header-logo" width="80" height="80" />
          <div className="brand-container pharma-layout">
            <h1 className="brand-name">DERMASIS</h1>
            <div className="divider" />
            <span className="brand-suffix">REMEDIES PVT. LTD.</span>
          </div>
        </div>
        <button 
          className="mobile-menu-btn" 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle Navigation"
        >
          {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      <nav className={`header-nav ${mobileMenuOpen ? 'open' : ''}`}>
        <a href="#visualizer" className="nav-link" onClick={() => navigateTo('home')}>
          Home
        </a>
        

          <div className="nav-dropdown" ref={dropRef}>
          <button
            className="nav-link nav-dropdown-trigger"
            onClick={() => setDocDropOpen(o => !o)}
            aria-expanded={docDropOpen}
          >
            <Users size={16} />
            Doctors
            <ChevronDown size={14} className={`nav-chevron${docDropOpen ? ' nav-chevron-open' : ''}`} />
          </button>
          
          {docDropOpen && (
            <div className="nav-dropdown-menu">
              <button className="nav-dropdown-item" onClick={() => navigateTo('doctors')}>
                <Eye size={14} /> View All
              </button>
              <div className="nav-dropdown-divider" />
              <button className="nav-dropdown-item nav-ddi-new" onClick={() => navigateTo('new-doctor')}>
                + New Doctor
              </button>
              <button className="nav-dropdown-item nav-ddi-delete" onClick={() => navigateTo('delete-doctor')}>
                🗑 Delete Doctor
              </button>
              <button className="nav-dropdown-item nav-ddi-edit" onClick={() => navigateTo('edit-doctor')}>
                ✏️ Add / Edit Products
              </button>
            </div>
          )}
        </div>
        <button onClick={() => navigateTo('contact')} className="nav-link">Contact</button>
      </nav>
    </header>
  );

  const SuspenseFallback = (
    <div className="dp-loading" style={{ minHeight: '60vh' }}>
      <div className="dp-spinner" />
      <p>Loading module...</p>
    </div>
  );

  // ── Route: Doctor pages & Contact ──────────────────────────────
  if (page === 'doctors') {
    return (
      <div className="app-container">
        {Header}
        <main className="main-content" style={{ alignItems: 'stretch', padding: '2rem 4rem' }}>
          <React.Suspense fallback={SuspenseFallback}>
            <DoctorsPage navigateTo={navigateTo} BACKEND_URL={BACKEND_URL} />
          </React.Suspense>
        </main>
        <Footer />
      </div>
    );
  }

  if (page === 'new-doctor') {
    return (
      <div className="app-container">
        {Header}
        <main className="main-content" style={{ alignItems: 'stretch', padding: '2rem 4rem' }}>
          <React.Suspense fallback={SuspenseFallback}>
            <NewDoctorPage navigateTo={navigateTo} BACKEND_URL={BACKEND_URL} />
          </React.Suspense>
        </main>
        <Footer />
      </div>
    );
  }

  if (page === 'delete-doctor') {
    return (
      <div className="app-container">
        {Header}
        <main className="main-content" style={{ alignItems: 'stretch', padding: '2rem 4rem' }}>
          <React.Suspense fallback={SuspenseFallback}>
            <DeleteDoctorPage navigateTo={navigateTo} BACKEND_URL={BACKEND_URL} />
          </React.Suspense>
        </main>
        <Footer />
      </div>
    );
  }

  if (page === 'edit-doctor') {
    return (
      <div className="app-container">
        {Header}
        <main className="main-content" style={{ alignItems: 'stretch', padding: '2rem 4rem' }}>
          <React.Suspense fallback={SuspenseFallback}>
            <EditDoctorPage navigateTo={navigateTo} BACKEND_URL={BACKEND_URL} />
          </React.Suspense>
        </main>
        <Footer />
      </div>
    );
  }

  if (page === 'edit-doctor-info') {
    return (
      <div className="app-container">
        {Header}
        <main className="main-content" style={{ alignItems: 'stretch', padding: '2rem 4rem' }}>
          <React.Suspense fallback={SuspenseFallback}>
            <EditDoctorInfoPage navigateTo={navigateTo} BACKEND_URL={BACKEND_URL} />
          </React.Suspense>
        </main>
        <Footer />
      </div>
    );
  }

  if (page === 'doctor-detail') {
    return (
      <div className="app-container">
        {Header}
        <main className="main-content" style={{ alignItems: 'stretch', padding: '2rem 4rem' }}>
          <React.Suspense fallback={SuspenseFallback}>
            <DoctorDetailPage navigateTo={navigateTo} BACKEND_URL={BACKEND_URL} doctorId={routeParams.doctorId} />
          </React.Suspense>
        </main>
        <Footer />
      </div>
    );
  }

  if (page === 'contact') {
    return (
      <div className="app-container">
        {Header}
        <main className="main-content" style={{ alignItems: 'stretch', padding: '0' }}>
          <React.Suspense fallback={SuspenseFallback}>
            <ContactPage navigateTo={navigateTo} />
          </React.Suspense>
        </main>
        <Footer />
      </div>
    );
  }

  // ── Route: Home (Product Visualizer) ────────────────
  return (
    <div className="app-container">
      {Header}

      <main className="main-content" id="visualizer">

        {/* Search Bar with Suggestions */}
        <div className="search-wrapper" ref={searchRef}>
          <div className="search-input-container">
            <Search className="search-icon" size={20} />
            <input
              type="text"
              className="search-input"
              placeholder="Search products by name..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(e.target.value.length > 0);
              }}
              onFocus={() => setShowSuggestions(searchQuery.length > 0)}
            />
          </div>

          {showSuggestions && filteredSuggestions.length > 0 && (
            <div className="search-suggestions active">
              {filteredSuggestions.map(product => (
                <div key={product._id} className="suggestion-item"
                  onClick={() => handleSuggestionClick(product)}>
                  <img src={clImg(product.link, 80)} alt={product.name}
                    className="suggestion-img" width="40" height="40" loading="lazy" />
                  <span>{product.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Product Visualizer */}
        {products.length > 0 ? (
          <div className="dv-vis-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div className="visualizer-container dv-visualizer-wrap"
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
                onClick={(e) => { e.stopPropagation(); prevProduct(); }} aria-label="Previous Product">
                <ChevronLeft size={40} />
              </button>

              <div className="product-image-wrapper dv-img-frame">
                <img
                  key={currentProduct?._id || currentProduct?.id}
                  src={clImg(currentProduct?.link, 730)}
                  alt={currentProduct?.name}
                  className={`product-image dv-product-img${imgAnim ? ` dv-${imgAnim}` : ''}`}
                  width="730"
                  height="730"
                />
              </div>

              <button className={`nav-arrow right dv-arrow${arrowVisible || isPlaying ? ' dv-arrow-visible' : ''}`} 
                onClick={(e) => { e.stopPropagation(); nextProduct(); }} aria-label="Next Product">
                <ChevronRight size={40} />
              </button>
            </div>
            
            <button className="dv-expand-btn" onClick={() => {
              setFullscreen(true);
              // Preload next 2 images using exact same resolution to utilize cache instantly
              const next1 = products[(currentIndex + 1) % products.length];
              const next2 = products[(currentIndex + 2) % products.length];
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
                      setCurrentLoopIteration(0); // Reset progress when changing count
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
                    setCurrentIndex(0);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}>
                    Back to Start
                  </button>
                  <button className="ap-end-btn ap-btn-again" onClick={() => {
                    setHasFinishedPlay(false);
                    setCurrentIndex(0);
                    setIsPlaying(true);
                  }}>
                    Play Again
                  </button>
                </div>
              </div>
            )}

            {/* Fullscreen Overlay */}
            {fullscreen && (
              <div className="dv-fullscreen-overlay">
                <button className="dv-fs-close" onClick={() => setFullscreen(false)}>
                  <X size={28} />
                </button>
                {/* <div className="dv-fs-name">{currentProduct?.name}</div> */}
                <div className="dv-fs-counter">{currentIndex + 1} / {products.length}</div>

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
                      key={`fs-${currentProduct?._id || currentProduct?.id}`}
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
                        setCurrentIndex(0);
                        setFullscreen(false);
                      }}>
                        Close Fullscreen
                      </button>
                      <button className="ap-end-btn ap-btn-again" onClick={() => {
                        setHasFinishedPlay(false);
                        setCurrentIndex(0);
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
        ) : (
          <div className="no-results">
            <p>Failed to Connect The Server to load products...</p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

// ── Shared Footer Component ──────────────────────────────────────────────────
const LOGO_URL_FOOTER = `${CLOUDINARY_BASE}/f_auto,q_auto,w_300/v1777359495/IMG-20260407-WA0000_eyvt70.jpg`;

function Footer() {
  return (
    <footer className="footer" id="contact">
      <div className="footer-content" style={{ paddingBottom: '0', borderBottom: 'none', justifyContent: 'center' }}>
        <div className="footer-section" style={{ textAlign: 'center' }}>
          <img src={LOGO_URL_FOOTER} alt="Dermasis Logo" className="footer-logo"
            width="80" height="80" loading="lazy" style={{ margin: '0 auto 1rem' }} />
          <p className="footer-text" style={{ marginTop: '1rem', justifyContent: 'center' }}>
            DERMASIS REMEDIES Pvt. Ltd.
          </p>
        </div>
      </div>

      <div className="footer-bottom" style={{ paddingTop: '1rem' }}>
        <p>&copy; {new Date().getFullYear()} Dermasis Remedies Pvt. Ltd. All rights reserved.</p>
        <p style={{ marginTop: '0.5rem', color: 'var(--color-secondary)' }}>
          Powered by Softcapphyjas Pvt. Ltd.
        </p>
      </div>
    </footer>
  );
}

export default App;