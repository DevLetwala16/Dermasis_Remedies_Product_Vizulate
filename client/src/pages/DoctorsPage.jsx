import React, { useState, useEffect, useRef } from 'react';
import { Search, UserCheck, Plus, Trash2, Edit3, ChevronRight, Filter, X } from 'lucide-react';

function DoctorsPage({ navigateTo, BACKEND_URL }) {
  const [doctors, setDoctors]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [activeFilters, setActiveFilters] = useState([]);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const filterMenuRef = useRef(null);

  useEffect(() => { fetchDoctors(); }, []);

  useEffect(() => {
    const handler = e => { if (filterMenuRef.current && !filterMenuRef.current.contains(e.target)) setShowFilterMenu(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${BACKEND_URL}/api/doctors`);
      const data = await res.json();
      setDoctors(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch doctors:', err);
    } finally {
      setLoading(false);
    }
  };

  const FILTER_OPTIONS = [
    { id: 'name-asc', label: 'A-Z (Name)' },
    { id: 'name-desc', label: 'Z-A (Name)' },
    { id: 'state-asc', label: 'State (A-Z)' },
    { id: 'city-asc', label: 'City (A-Z)' },
    { id: 'grade', label: 'By Grade' },
    { id: 'visitDay', label: 'By Visit Day' },
    { id: 'degreeType', label: 'By Degree' },
    { id: 'specialization', label: 'By Specialization' }
  ];

  const toggleFilter = (filterId) => {
    if (activeFilters.includes(filterId)) {
      setActiveFilters(activeFilters.filter(id => id !== filterId));
    } else {
      setActiveFilters([...activeFilters, filterId]);
    }
  };

  let processedDoctors = [...doctors];
  if (searchQuery) {
    processedDoctors = processedDoctors.filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }
  
  // Apply sorts (stable sort means later sorts take priority)
  activeFilters.forEach(f => {
    switch(f) {
      case 'name-asc': processedDoctors.sort((a,b) => a.name.localeCompare(b.name)); break;
      case 'name-desc': processedDoctors.sort((a,b) => b.name.localeCompare(a.name)); break;
      case 'state-asc': processedDoctors.sort((a,b) => (a.state||'').localeCompare(b.state||'')); break;
      case 'city-asc': processedDoctors.sort((a,b) => (a.city||'').localeCompare(b.city||'')); break;
      case 'grade': processedDoctors.sort((a,b) => (a.grade||'').localeCompare(b.grade||'')); break;
      case 'visitDay': processedDoctors.sort((a,b) => (a.visitDay||'').localeCompare(b.visitDay||'')); break;
      case 'degreeType': processedDoctors.sort((a,b) => (a.degreeType||'').localeCompare(b.degreeType||'')); break;
      case 'specialization': processedDoctors.sort((a,b) => (a.specialization||'').localeCompare(b.specialization||'')); break;
      default: break;
    }
  });

  // Group by the first active filter
  let groupedDoctors = null;
  if (activeFilters.length > 0 && processedDoctors.length > 0) {
    const primaryFilter = activeFilters[0];
    groupedDoctors = {};
    processedDoctors.forEach(doc => {
      let key = 'Other';
      switch(primaryFilter) {
        case 'name-asc':
        case 'name-desc':
          key = doc.name.charAt(0).toUpperCase();
          break;
        case 'state-asc':
          key = doc.state || 'Unknown State';
          break;
        case 'city-asc':
          key = doc.city || 'Unknown City';
          break;
        case 'grade':
          key = doc.grade ? `Grade ${doc.grade}` : 'Unassigned Grade';
          break;
        case 'visitDay':
          key = doc.visitDay || 'Unassigned Day';
          break;
        case 'degreeType':
          key = doc.degreeType || 'Unknown Degree';
          break;
        case 'specialization':
          key = doc.specialization || 'General Practice';
          break;
      }
      if (!groupedDoctors[key]) groupedDoctors[key] = [];
      groupedDoctors[key].push(doc);
    });
  }

  return (
    <div className="dp-page">
      {/* Page Header */}
      <div className="dp-page-header">
        <div className="dp-page-title">
          <UserCheck size={28} className="dp-page-icon" />
          <h2>Doctors</h2>
          <span className="dp-count-badge">{doctors.length}</span>
        </div>
        <div className="dp-action-row">
          <button className="dp-btn dp-btn-new"    onClick={() => navigateTo('new-doctor')}>
            <Plus size={16} /> New
          </button>
          <button className="dp-btn dp-btn-delete" onClick={() => navigateTo('delete-doctor')}>
            <Trash2 size={16} /> Delete
          </button>
          <button className="dp-btn dp-btn-edit"   onClick={() => navigateTo('edit-doctor-info')}>
            <Edit3 size={16} /> Edit Details
          </button>
          <button className="dp-btn dp-btn-edit"   onClick={() => navigateTo('edit-doctor')}>
            <Edit3 size={16} /> Edit Products
          </button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="dp-search-filter-row" style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', position: 'relative' }}>
        <div className="dp-search-bar" style={{ flex: 1, margin: 0 }}>
          <Search size={18} className="dp-search-icon" />
          <input
            type="text"
            placeholder="Search doctors by name..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="dp-search-input"
          />
        </div>
        
        <div ref={filterMenuRef} style={{ position: 'relative' }}>
          <button 
            className="dp-btn" 
            onClick={() => setShowFilterMenu(!showFilterMenu)}
            style={{ height: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#fff', border: '1px solid #e2e8f0', color: '#475569' }}
          >
            <Filter size={18} />
            Filter
            {activeFilters.length > 0 && (
              <span style={{ background: '#3b82f6', color: '#fff', borderRadius: '50%', padding: '0 6px', fontSize: '12px' }}>
                {activeFilters.length}
              </span>
            )}
          </button>
          
          {showFilterMenu && (
            <div className="dp-filter-menu" style={{ position: 'absolute', top: '100%', right: 0, marginTop: '0.5rem', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1rem', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', zIndex: 50, width: '220px' }}>
              <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.9rem', color: '#1e293b' }}>Sort / Filter By</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {FILTER_OPTIONS.map(opt => (
                  <label key={opt.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem', color: '#475569' }}>
                    <input 
                      type="checkbox" 
                      checked={activeFilters.includes(opt.id)}
                      onChange={() => toggleFilter(opt.id)}
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
              <button 
                onClick={() => { setActiveFilters([]); setShowFilterMenu(false); }}
                style={{ width: '100%', marginTop: '1rem', padding: '0.5rem', background: '#f1f5f9', border: 'none', borderRadius: '4px', color: '#64748b', cursor: 'pointer', fontSize: '0.9rem' }}
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Active Filter Chips */}
      {activeFilters.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
          {activeFilters.map(fId => {
            const opt = FILTER_OPTIONS.find(o => o.id === fId);
            return (
              <span key={fId} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: '#e0e7ff', color: '#3730a3', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.85rem' }}>
                {opt.label}
                <X size={14} style={{ cursor: 'pointer' }} onClick={() => toggleFilter(fId)} />
              </span>
            );
          })}
          <span 
            style={{ display: 'flex', alignItems: 'center', fontSize: '0.85rem', color: '#64748b', cursor: 'pointer', marginLeft: '0.5rem' }}
            onClick={() => setActiveFilters([])}
          >
            Clear All
          </span>
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="dp-loading">
          <div className="dp-spinner" />
          <p>Loading doctors…</p>
        </div>
      ) : processedDoctors.length === 0 ? (
        <div className="dp-empty">
          <UserCheck size={48} opacity={0.3} />
          <p>No doctors found.</p>
          <button className="dp-btn dp-btn-new" onClick={() => navigateTo('new-doctor')}>
            <Plus size={16} /> Add First Doctor
          </button>
        </div>
      ) : groupedDoctors ? (
        <div className="dp-grouped-container" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {Object.keys(groupedDoctors).sort((a, b) => {
             if (activeFilters[0] === 'name-desc') return b.localeCompare(a);
             return a.localeCompare(b);
          }).map(groupKey => (
            <div key={groupKey} className="dp-group-section">
              <h3 style={{ fontSize: '1.25rem', color: '#1e293b', marginBottom: '1rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                {groupKey} <span style={{ fontSize: '0.9rem', color: '#64748b', marginLeft: '0.5rem' }}>({groupedDoctors[groupKey].length})</span>
              </h3>
              <div className="dp-grid">
                {groupedDoctors[groupKey].map(doc => (
                  <div
                    key={doc._id}
                    className="dp-card"
                    onClick={() => navigateTo('doctor-detail', { doctorId: doc._id })}
                  >
                    <div className="dp-card-avatar">
                      {doc.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="dp-card-body">
                      <h3 className="dp-card-name">{doc.name}</h3>
                      <p className="dp-card-degree">{doc.degreeType}</p>
                      <p className="dp-card-location">{doc.city}, {doc.state}</p>
                      <div className="dp-card-footer">
                        <span className="dp-grade-badge">Grade {doc.grade}</span>
                        <span className="dp-product-count">
                          {doc.products?.length || 0} product{(doc.products?.length || 0) !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                    <ChevronRight size={18} className="dp-card-arrow" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="dp-grid">
          {processedDoctors.map(doc => (
            <div
              key={doc._id}
              className="dp-card"
              onClick={() => navigateTo('doctor-detail', { doctorId: doc._id })}
            >
              <div className="dp-card-avatar">
                {doc.name.charAt(0).toUpperCase()}
              </div>
              <div className="dp-card-body">
                <h3 className="dp-card-name">{doc.name}</h3>
                <p className="dp-card-degree">{doc.degreeType}</p>
                <p className="dp-card-location">{doc.city}, {doc.state}</p>
                <div className="dp-card-footer">
                  <span className="dp-grade-badge">Grade {doc.grade}</span>
                  <span className="dp-product-count">
                    {doc.products?.length || 0} product{(doc.products?.length || 0) !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
              <ChevronRight size={18} className="dp-card-arrow" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default DoctorsPage;
