import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Edit3, Search, Download, CheckCircle, Save } from 'lucide-react';

const DEGREE_TYPES = [
  'MBBS', 'MD', 'MS', 'BDS', 'MDS', 'BAMS', 'BHMS', 'BUMS',
  'DNB', 'DM', 'MCh', 'BPT', 'MPT', 'DOMS', 'DO', 'Other'
];

const SPECIALIZATIONS = [
  'Cardiology', 'Dentistry', 'Dermatology', 'Endocrinology', 'ENT (Otolaryngology)', 
  'Gastroenterology', 'General Practice', 'Gynecology', 'Hematology', 
  'Internal Medicine', 'Neurology', 'Oncology', 'Ophthalmology', 
  'Orthopedics', 'Pediatrics', 'Psychiatry', 'Pulmonology', 
  'Radiology', 'Rheumatology', 'Surgery', 'Urology'
];

function EditDoctorInfoPage({ navigateTo, BACKEND_URL }) {
  const [allDoctors, setAllDoctors] = useState([]);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSug, setShowSug] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [fetching, setFetching] = useState(false);

  const [form, setForm] = useState({
    name: '', phone: '', state: '', city: '',
    subLocality: '', email: '', degreeType: '', specialization: '', grade: '', visitDay: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const [indiaStates, setIndiaStates] = useState([]);
  const [indiaCities, setIndiaCities] = useState([]);

  const sugRef = useRef(null);

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/doctors`)
      .then(r => r.json())
      .then(d => setAllDoctors(Array.isArray(d) ? d : []))
      .catch(console.error);
      
    fetch('https://countriesnow.space/api/v0.1/countries/states', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ country: 'India' })
    })
    .then(r => r.json())
    .then(d => {
      if(d && d.data && d.data.states) {
        setIndiaStates(d.data.states.map(s => s.name));
      }
    })
    .catch(console.error);
  }, [BACKEND_URL]);

  useEffect(() => {
    if (form.state) {
      fetch('https://countriesnow.space/api/v0.1/countries/state/cities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ country: 'India', state: form.state })
      })
      .then(r => r.json())
      .then(d => {
        if(d && d.data) {
          setIndiaCities(d.data);
        }
      })
      .catch(console.error);
    } else {
      setIndiaCities([]);
    }
  }, [form.state]);

  useEffect(() => {
    const handler = e => { 
      if (sugRef.current && !sugRef.current.contains(e.target)) setShowSug(false); 
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

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
    setShowSug(false);
    setConfirmed(false);
  };

  const fetchDoctorInfo = async () => {
    if (!selectedDoc) return;
    setFetching(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/doctors/${selectedDoc._id}`);
      const data = await res.json();
      setForm({
        name: data.name || '',
        phone: data.phone || '',
        state: data.state || '',
        city: data.city || '',
        subLocality: data.subLocality || '',
        email: data.email || '',
        degreeType: data.degreeType || '',
        specialization: data.specialization || '',
        grade: data.grade || '',
        visitDay: data.visitDay || ''
      });
      setErrors({});
      setConfirmed(false);
    } catch (err) {
      console.error(err);
    } finally {
      setFetching(false);
    }
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim())        e.name        = 'Name is required';
    if (form.phone.trim() && !/^\d{10}$/.test(form.phone.replace(/\s/g,'')))
                                  e.phone       = 'Phone must be exactly 10 digits';
    if (!form.state.trim())       e.state       = 'State is required';
    if (!form.city.trim())        e.city        = 'City is required';
    if (form.email && !/\S+@\S+\.\S+/.test(form.email))
                                  e.email       = 'Enter a valid email';
    if (!form.degreeType)         e.degreeType  = 'Degree type is required';
    if (!form.visitDay)           e.visitDay    = 'Visit day is required';
    if (!form.grade)              e.grade       = 'Grade is required';
    return e;
  };

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    setErrors(er => ({ ...er, [name]: undefined }));
  };

  const handleSave = async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/doctors/${selectedDoc._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update doctor');
      }
      setSaved(true);
      setTimeout(() => navigateTo('doctors'), 1500);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (saved) {
    return (
      <div className="nd-success">
        <CheckCircle size={64} className="nd-success-icon" />
        <h2>Doctor Details Updated!</h2>
        <p>Redirecting to Doctors page…</p>
      </div>
    );
  }

  return (
    <div className="ed-page">
      <div className="dd-header">
        <button className="nd-back-btn" onClick={() => navigateTo('doctors')}>
          <ArrowLeft size={18} /> Back to Doctors
        </button>
        <div className="nd-title">
          <Edit3 size={26} />
          <h2>Edit Doctor Details</h2>
        </div>
      </div>

      <div className="ed-section">
        <h3 className="ed-section-title">Search Doctor</h3>
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
              {suggestions.map(doc => (
                <div key={doc._id} className="ed-suggestion-item" onClick={() => selectDoctor(doc)}>
                  <div className="ed-sug-avatar">{doc.name.charAt(0)}</div>
                  <div>
                    <p className="ed-sug-name">{doc.name}</p>
                    <p className="ed-sug-meta">{doc.city}, {doc.state}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {form.name && (
        <div className="nd-card" style={{ marginTop: '2rem' }}>
          <h3 className="ed-section-title">Edit Details</h3>
          <div className="nd-form-grid">
            <div className="nd-field">
              <label htmlFor="nd-name">Doctor Name *</label>
              <input id="nd-name" name="name" placeholder="Full Name" value={form.name} onChange={handleChange} className={errors.name ? 'nd-input nd-input-error' : 'nd-input'} />
              {errors.name && <span className="nd-error">{errors.name}</span>}
            </div>
            <div className="nd-field">
              <label htmlFor="nd-phone">Phone Number <span className="nd-optional">(optional)</span></label>
              <input id="nd-phone" name="phone" placeholder="+91 xxxxxxxxxx" value={form.phone} onChange={handleChange} className={errors.phone ? 'nd-input nd-input-error' : 'nd-input'} />
              {errors.phone && <span className="nd-error">{errors.phone}</span>}
            </div>

            <div className="nd-field">
              <label htmlFor="nd-state">State *</label>
              <div style={{ position: 'relative' }}>
                <input id="nd-state" name="state" placeholder="State" value={form.state} onChange={handleChange} className={errors.state ? 'nd-input nd-input-error' : 'nd-input'} list="state-list" autoComplete="off" />
                <datalist id="state-list">
                  {indiaStates.map(s => <option key={s} value={s} />)}
                </datalist>
              </div>
              {errors.state && <span className="nd-error">{errors.state}</span>}
            </div>

            <div className="nd-field">
              <label htmlFor="nd-city">City *</label>
              <div style={{ position: 'relative' }}>
                <input id="nd-city" name="city" placeholder="city / Village" value={form.city} onChange={handleChange} disabled={!form.state} className={errors.city ? 'nd-input nd-input-error' : 'nd-input'} list="city-list" autoComplete="off" />
                <datalist id="city-list">
                  {indiaCities.map(c => <option key={c} value={c} />)}
                </datalist>
              </div>
              {errors.city && <span className="nd-error">{errors.city}</span>}
            </div>

            <div className="nd-field">
              <label htmlFor="nd-subLocality">Sub-Locality<span className="nd-optional">(optional)</span></label>
              <input id="nd-subLocality" name="subLocality" placeholder="Area / Road / Street" value={form.subLocality} onChange={handleChange} className={errors.subLocality ? 'nd-input nd-input-error' : 'nd-input'} />
              {errors.subLocality && <span className="nd-error">{errors.subLocality}</span>}
            </div>
            <div className="nd-field">
              <label htmlFor="nd-email">Email Address <span className="nd-optional">(optional)</span></label>
              <input id="nd-email" name="email" type="email" placeholder="doc@example.com" value={form.email} onChange={handleChange} className={errors.email ? 'nd-input nd-input-error' : 'nd-input'} />
              {errors.email && <span className="nd-error">{errors.email}</span>}
            </div>

            <div className="nd-field">
              <label htmlFor="nd-degree">Degree Type *</label>
              <select id="nd-degree" name="degreeType" value={form.degreeType} onChange={handleChange} className={errors.degreeType ? 'nd-input nd-select nd-input-error' : 'nd-input nd-select'}>
                <option value="">Select Degree…</option>
                {DEGREE_TYPES.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              {errors.degreeType && <span className="nd-error">{errors.degreeType}</span>}
            </div>

            <div className="nd-field">
              <label htmlFor="nd-specialization">Specialization</label>
              <select id="nd-specialization" name="specialization" value={form.specialization} onChange={handleChange} className={errors.specialization ? 'nd-input nd-select nd-input-error' : 'nd-input nd-select'}>
                <option value="">Select Specialization…</option>
                {SPECIALIZATIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              {errors.specialization && <span className="nd-error">{errors.specialization}</span>}
            </div>

            <div className="nd-field">
              <label>Doctor Visit Day *</label>
              <div className="nd-checkbox-group" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '5px', padding: '0.5rem 0' }}>
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => {
                  const isChecked = form.visitDay ? form.visitDay.split(', ').includes(day) : false;
                  return (
                    <label key={day} style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', fontSize: '0.9rem', color: '#475569' }}>
                      <input 
                        type="checkbox" 
                        name="visitDay" 
                        value={day} 
                        checked={isChecked}
                        onChange={(e) => {
                          const value = e.target.value;
                          setForm(f => {
                            let newDays = f.visitDay ? f.visitDay.split(', ').filter(Boolean) : [];
                            if (e.target.checked) {
                              if (!newDays.includes(value)) newDays.push(value);
                            } else {
                              newDays = newDays.filter(d => d !== value);
                            }
                            const order = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                            newDays.sort((a, b) => order.indexOf(a) - order.indexOf(b));
                            return { ...f, visitDay: newDays.join(', ') };
                          });
                          setErrors(er => ({ ...er, visitDay: undefined }));
                        }}
                        style={{ accentColor: '#3b82f6', width: '16px', height: '16px', cursor: 'pointer' }}
                      />
                      {day}
                    </label>
                  );
                })}
              </div>
              {errors.visitDay && <span className="nd-error">{errors.visitDay}</span>}
            </div>

            <div className="nd-field">
              <label htmlFor="nd-grade">Grade *</label>
              <select id="nd-grade" name="grade" value={form.grade} onChange={handleChange} className={errors.grade ? 'nd-input nd-select nd-input-error' : 'nd-input nd-select'}>
                <option value="">Select Grade…</option>
                <option value="A">Grade A</option>
                <option value="B">Grade B</option>
                <option value="C">Grade C</option>
                <option value="D">Grade D</option>
              </select>
              {errors.grade && <span className="nd-error">{errors.grade}</span>}
            </div>
          </div>

          <div className="ed-save-section" style={{ marginTop: '2rem' }}>
            <label className="ed-confirm-check">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={e => setConfirmed(e.target.checked)}
              />
              I confirm all edited details are correct
            </label>
            <button
              className="ed-save-btn"
              onClick={handleSave}
              disabled={!confirmed || loading}
            >
              {loading ? <span className="nd-btn-spinner" /> : <Save size={18} />} Save Changes
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default EditDoctorInfoPage;
