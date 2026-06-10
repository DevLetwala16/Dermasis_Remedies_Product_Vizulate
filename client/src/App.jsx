import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronLeft, ChevronRight, Mail, MapPin, Phone, Eye } from 'lucide-react';
import './index.css';

const LOGO_URL = "https://res.cloudinary.com/dpsq08nun/image/upload/v1777359495/IMG-20260407-WA0000_eyvt70.jpg";
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
          
          // Preload images for zero wait time
          data.forEach(product => {
            const img = new Image();
            img.src = product.link;
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
        <img src={LOGO_URL} alt="Dermasis Remedies Loading" className="loading-logo" />
        <p className="loading-text">LOADING ...</p>
      </div>
    );
  }

  const currentProduct = products[currentIndex];

  return (
    <div className="app-container">
      <header className="header">
  <div className="header-brand">
    <img src={LOGO_URL} alt="Dermasis Logo" className="header-logo" />
    <h1 className="brand-name">
      DERMASIS <span className="brand-suffix">REMEDIES Pvt. Ltd.</span>
    </h1>
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
                  <img src={product.link} alt={product.name} className="suggestion-img" />
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
              <button className="nav-arrow left" onClick={prevProduct}>
                <ChevronLeft size={40} />
              </button>
              
              <div className="product-image-wrapper">
                {/* Because images are preloaded, this will change instantly */}
                <img src={currentProduct?.link} alt={currentProduct?.name} className="product-image" />
              </div>

              <button className="nav-arrow right" onClick={nextProduct}>
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
            <img src={LOGO_URL} alt="Dermasis Logo" className="footer-logo" />
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
            <p className="footer-text"><MapPin size={18} /> 218, Crystal Plaza, Kiran Chowk Rd, Varachha</p>
            <p className="footer-text" style={{marginLeft: "26px"}}>Surat, Gujarat, India, 395010</p>
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