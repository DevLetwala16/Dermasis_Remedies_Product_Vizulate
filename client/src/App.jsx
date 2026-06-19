import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronLeft, ChevronRight, Mail, MapPin, Phone, Eye, ChevronDown, Users, Maximize2, X, Play, Pause, Settings, Menu } from 'lucide-react';
import './index.css';
import DoctorsPage      from './pages/DoctorsPage.jsx';
import NewDoctorPage    from './pages/NewDoctorPage.jsx';
import DeleteDoctorPage from './pages/DeleteDoctorPage.jsx';
import EditDoctorPage   from './pages/EditDoctorPage.jsx';
import EditDoctorInfoPage from './pages/EditDoctorInfoPage.jsx';
import DoctorDetailPage from './pages/DoctorDetailPage.jsx';

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
  const hoverTimer = useRef(null);

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
            img.src = clImg(product.link, 900);
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
          setIsPlaying(false);
          setHasFinishedPlay(true);
        } else {
          goTo('next');
        }
      }, delay);
    }
    return () => clearTimeout(timer);
  }, [currentIndex, isPlaying, playSpeed, products.length, hasFinishedPlay, animStyle]);

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
        

        {/* ── Doctors Dropdown ── */}
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
        <a href="#contact" className="nav-link">Contact</a>
      </nav>
    </header>
  );

  // ── Route: Doctor pages ──────────────────────────────
  if (page === 'doctors') {
    return (
      <div className="app-container">
        {Header}
        <main className="main-content" style={{ alignItems: 'stretch', padding: '2rem 4rem' }}>
          <DoctorsPage navigateTo={navigateTo} BACKEND_URL={BACKEND_URL} />
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
          <NewDoctorPage navigateTo={navigateTo} BACKEND_URL={BACKEND_URL} />
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
          <DeleteDoctorPage navigateTo={navigateTo} BACKEND_URL={BACKEND_URL} />
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
          <EditDoctorPage navigateTo={navigateTo} BACKEND_URL={BACKEND_URL} />
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
          <EditDoctorInfoPage navigateTo={navigateTo} BACKEND_URL={BACKEND_URL} />
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
          <DoctorDetailPage navigateTo={navigateTo} BACKEND_URL={BACKEND_URL} doctorId={routeParams.doctorId} />
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
              onClick={() => setIsPlaying(!isPlaying)}
            >
              <button className={`nav-arrow left dv-arrow${arrowVisible || isPlaying ? ' dv-arrow-visible' : ''}`} 
                onClick={(e) => { e.stopPropagation(); prevProduct(); }} aria-label="Previous Product">
                <ChevronLeft size={40} />
              </button>

              <div className="product-image-wrapper dv-img-frame">
                <img
                  key={currentProduct?._id || currentProduct?.id}
                  src={clImg(currentProduct?.link, 900)}
                  alt={currentProduct?.name}
                  className={`product-image dv-product-img${imgAnim ? ` dv-${imgAnim}` : ''}`}
                  width="900"
                  height="900"
                />
              </div>

              <button className={`nav-arrow right dv-arrow${arrowVisible || isPlaying ? ' dv-arrow-visible' : ''}`} 
                onClick={(e) => { e.stopPropagation(); nextProduct(); }} aria-label="Next Product">
                <ChevronRight size={40} />
              </button>
            </div>
            
            <button className="dv-expand-btn" onClick={() => setFullscreen(true)} title="Fullscreen">
              <Maximize2 size={20} />
            </button>

            {/* Settings Toggle & Controls */}
            <div className="ap-settings-container">
              <button className="ap-settings-toggle" onClick={() => setShowSettings(!showSettings)}>
                <Settings size={18} /> Settings
              </button>
              
              {showSettings && (
                <div className="ap-controls">
                  <button className="ap-btn" onClick={() => setIsPlaying(!isPlaying)} title={isPlaying ? "Pause" : "Play"}>
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
                  </select>
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
                  onClick={() => setIsPlaying(!isPlaying)}
                >
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
                    <Settings size={18} /> Settings
                  </button>
                  
                  {showSettings && (
                    <div className="ap-controls">
                      <button className="ap-btn" onClick={() => setIsPlaying(!isPlaying)}>
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
                      </select>
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
      <div className="footer-content">
        <div className="footer-section">
          <img src={LOGO_URL_FOOTER} alt="Dermasis Logo" className="footer-logo"
            width="80" height="80" loading="lazy" />
          <p className="footer-text" style={{ marginTop: '1rem' }}>
            DERMASIS REMEDIES Pvt. Ltd. <br />
            Professional Pharmaceutical Product Visualizer.
          </p>
        </div>

        <div className="footer-section">
          <h3 className="footer-title">Contact Us</h3>
          <p className="footer-text"><Mail size={18} /> dermasisremedies@gmail.com</p>
          <p className="footer-text"><Phone size={18} /> +91 99749 07955</p>
        </div>

        <div className="footer-section">
          <h3 className="footer-title">Headquarters</h3>
          <p className="footer-text"><MapPin size={18} /> 218, Crystal Plaza,</p>
          <p className="footer-text" style={{ marginLeft: "26px" }}>SRT, Gujarat, India, 395010</p>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} Dermasis Remedies Pvt. Ltd. All rights reserved.</p>
        <p style={{ marginTop: '0.5rem', color: 'var(--color-secondary)' }}>
          Powered by Softcapphyjas Pvt. Ltd.
        </p>
      </div>
    </footer>
  );
}

export default App;