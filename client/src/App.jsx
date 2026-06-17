import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronLeft, ChevronRight, Mail, MapPin, Phone, Eye } from 'lucide-react';
import './index.css';

// Cloudinary base — apply f_auto,q_auto (format + quality) and optional width resize
const CLOUDINARY_BASE = "https://res.cloudinary.com/dpsq08nun/image/upload";
const LOGO_VERSION = "v1777359495/IMG-20260407-WA0000_eyvt70.jpg";

/**
 * Build an optimised Cloudinary URL.
 * @param {string} src  - Raw Cloudinary URL or path fragment after /upload/
 * @param {number} [w]  - Optional pixel width to resize to at the edge
 */
const clImg = (src, w) => {
  // If src is already a full Cloudinary URL, replace /upload/ with the transforms
  const transforms = w ? `f_auto,q_auto,w_${w}` : 'f_auto,q_auto';
  if (src && src.startsWith(CLOUDINARY_BASE)) {
    return src.replace('/image/upload/', `/image/upload/${transforms}/`);
  }
  return src; // non-Cloudinary URLs pass through unchanged
};

const LOGO_URL = `${CLOUDINARY_BASE}/f_auto,q_auto,w_300/${LOGO_VERSION}`;
// const LOGO_URL1 = `${CLOUDINARY_BASE}${LOGO_VERSION}`;
const BACKEND_URL = window.location.hostname === "localhost"
  ? "http://localhost:5000"
  : "https://dermasis-remedies-product-vizulate.onrender.com";

const API_URL = `${BACKEND_URL}/api/vizulate-products`;

function App() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Swipe State
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  const searchRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(API_URL);
        if (response.ok) {
          const data = await response.json();
          setProducts(data);
          
          // Preload optimised images for zero wait time
          data.forEach(product => {
            const img = new Image();
            img.src = clImg(product.link, 900);
          });
        } else {
          console.error("Failed to fetch products");
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        // Ensure loading screen shows for a little bit for the logo animation
        setTimeout(() => setLoading(false), 2000);
      }
    };

    fetchData();
  }, []);

  // Handle clicking outside of search suggestions to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter products based on search
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

  // Handle Navigation
  const nextProduct = () => {
    if (products.length > 0) {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % products.length);
    }
  };

  const prevProduct = () => {
    if (products.length > 0) {
      setCurrentIndex((prevIndex) => (prevIndex === 0 ? products.length - 1 : prevIndex - 1));
    }
  };

  // Swipe handlers
  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => setTouchEnd(e.targetTouches[0].clientX);

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      nextProduct();
    }
    if (isRightSwipe) {
      prevProduct();
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        {/* LCP element — fetchpriority=high + no lazy loading for fastest paint */}
        <img
          src={LOGO_URL}
          alt="Dermasis Remedies Loading..."
          className="loading-logo"
          width="300"
          height="300"
          fetchpriority="high"
        />
        <p className="loading-text">LOADING ...</p>
      </div>
    );
  }

  const currentProduct = products[currentIndex];

  return (
    <div className="app-container">
      <header className="header">
  <div className="header-brand">
    {/* Explicit width/height prevents Cumulative Layout Shift */}
    <img
      src={LOGO_URL}
      alt="Dermasis Logo"
      className="header-logo"
      width="80"
      height="80"
    />
    {/* Enhanced HTML for this layout */}
    <div className="brand-container pharma-layout">
      <h1 className="brand-name">DERMASIS</h1>
      <div className="divider"></div>
      <span className="brand-suffix">REMEDIES PVT. LTD.</span>
    </div>
  </div>
  <nav className="header-nav">
    <a href="#visualizer" className="nav-link">Product Visualizer</a>
    <a href="#contact" className="nav-link">Contact Details</a>
  </nav>
</header>

      {/* MAIN CONTENT */}
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
                <div
                  key={product._id}
                  className="suggestion-item"
                  onClick={() => handleSuggestionClick(product)}
                >
                  {/* Resize thumbnail to 80px wide at the Cloudinary edge */}
                  <img
                    src={clImg(product.link, 80)}
                    alt={product.name}
                    className="suggestion-img"
                    width="40"
                    height="40"
                    loading="lazy"
                  />
                  <span>{product.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Product Visualizer */}
        {products.length > 0 ? (
          <>
            <div className="product-info">
              <h1 className="product-name">{currentProduct?.name}</h1>
            </div>
            
            <div 
              className="visualizer-container"
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
            >
              {/* aria-label makes carousel controls accessible to screen readers */}
              <button className="nav-arrow left" onClick={prevProduct} aria-label="Previous Product">
                <ChevronLeft size={40} />
              </button>

              <div className="product-image-wrapper">
                {/* Cloudinary resizes to 900px wide; explicit dims reserve layout space */}
                <img
                  src={clImg(currentProduct?.link, 900)}
                  alt={currentProduct?.name}
                  className="product-image"
                  width="900"
                  height="900"
                />
              </div>

              <button className="nav-arrow right" onClick={nextProduct} aria-label="Next Product">
                <ChevronRight size={40} />
              </button>
            </div>
          </>
        ) : (
          <div className="no-results">
            <p>Failed to Connected The Server For load products...</p>
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="footer" id="contact">
        <div className="footer-content">
          <div className="footer-section">
            <img
              src={LOGO_URL}
              alt="Dermasis Logo"
              className="footer-logo"
              width="80"
              height="80"
              loading="lazy"
            />
            <p className="footer-text" style={{marginTop: '1rem'}}>
              DERMASIS REMEDIES Pvt. Ltd. <br/>
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
            <p className="footer-text" style={{marginLeft: "26px"}}>SRT, Gujarat, India, 395010</p>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} Dermasis Remedies Pvt. Ltd. All rights reserved.</p>
          <p style={{ marginTop: '0.5rem', color: 'var(--color-secondary)' }}>Powered by Softcapphyjas Pvt. Ltd.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;