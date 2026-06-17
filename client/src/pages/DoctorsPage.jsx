import React, { useState, useEffect, useRef } from 'react';
import { Search, UserCheck, Plus, Trash2, Edit3, ChevronRight } from 'lucide-react';

function DoctorsPage({ navigateTo, BACKEND_URL }) {
  const [doctors, setDoctors]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => { fetchDoctors(); }, []);

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

  const filtered = doctors.filter(d =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          <button className="dp-btn dp-btn-edit"   onClick={() => navigateTo('edit-doctor')}>
            <Edit3 size={16} /> Add / Edit
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="dp-search-bar">
        <Search size={18} className="dp-search-icon" />
        <input
          type="text"
          placeholder="Search doctors by name..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="dp-search-input"
        />
      </div>

      {/* Grid */}
      {loading ? (
        <div className="dp-loading">
          <div className="dp-spinner" />
          <p>Loading doctors…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="dp-empty">
          <UserCheck size={48} opacity={0.3} />
          <p>No doctors found.</p>
          <button className="dp-btn dp-btn-new" onClick={() => navigateTo('new-doctor')}>
            <Plus size={16} /> Add First Doctor
          </button>
        </div>
      ) : (
        <div className="dp-grid">
          {filtered.map(doc => (
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
