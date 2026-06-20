import React, { useState } from 'react';
import { ArrowLeft, UserPlus, CheckCircle } from 'lucide-react';

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

const DEFAULT_PRODUCT = {
  id:   import.meta.env.VITE_DEFAULT_PRODUCT_ID   || '6a295740a8d4745e4a65250e',
  name: import.meta.env.VITE_DEFAULT_PRODUCT_NAME || ' Dermasis',
  link: import.meta.env.VITE_DEFAULT_PRODUCT_LINK || 'https://res.cloudinary.com/dpsq08nun/image/upload/v1781094139/coverpage.png_ieszk9.jpg',
};



function NewDoctorPage({ navigateTo, BACKEND_URL }) {
  const [form, setForm] = useState({
    name: '', phone: '', state: '', city: '',
    subLocality: '', email: '', degreeType: '', specialization: '', grade: '', visitDay: ''
  });
  const [errors,  setErrors]  = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [indiaStates, setIndiaStates] = useState([]);
  const [indiaCities, setIndiaCities] = useState([]);

  const [showStateSug, setShowStateSug] = useState(false);
  const [showCitySug, setShowCitySug] = useState(false);
  const stateRef = React.useRef(null);
  const cityRef = React.useRef(null);

  React.useEffect(() => {
    const handler = e => { 
      if (stateRef.current && !stateRef.current.contains(e.target)) setShowStateSug(false); 
      if (cityRef.current && !cityRef.current.contains(e.target)) setShowCitySug(false); 
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  React.useEffect(() => {
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
  }, []);

  React.useEffect(() => {
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

  const validate = () => {
    const e = {};
    if (!form.name.trim())        e.name        = 'Name is required';
    // if (!form.phone.trim())       e.phone       = 'Phone is required';
    // else if (!/^\d{10}$/.test(form.phone.replace(/\s/g,'')))
    //                               e.phone       = 'Phone must be exactly 10 digits';
    if (!form.state.trim())       e.state       = 'State is required';
    if (!form.city.trim())        e.city        = 'City is required';
    // if (!form.subLocality.trim()) e.subLocality = 'Sub locality is required';
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

  const handleSubmit = async e => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/doctors`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ ...form, defaultProduct: DEFAULT_PRODUCT }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create doctor');
      }
      setSuccess(true);
      setTimeout(() => navigateTo('doctors'), 2000);
    } catch (err) {
      setErrors({ submit: err.message });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="nd-success">
        <CheckCircle size={64} className="nd-success-icon" />
        <h2>Doctor Added Successfully!</h2>
        <p>Redirecting to Doctors page…</p>
      </div>
    );
  }

  return (
    <div className="nd-page">
      <div className="nd-header">
        <button className="nd-back-btn" onClick={() => navigateTo('doctors')}>
          <ArrowLeft size={18} /> Back to Doctors
        </button>
        <div className="nd-title">
          <UserPlus size={26} />
          <h2>Add New Doctor</h2>
        </div>
      </div>

      <form className="nd-form" onSubmit={handleSubmit} noValidate>
        <div className="nd-form-grid">

          {/* Name */}
          <div className="nd-field nd-field-full">
            <label htmlFor="nd-name">Full Name *</label>
            <input id="nd-name" name="name" type="text"
              placeholder="First Last" value={form.name} onChange={handleChange}
              className={errors.name ? 'nd-input nd-input-error' : 'nd-input'} />
            {errors.name && <span className="nd-error">{errors.name}</span>}
          </div>

          {/* Phone */}
          <div className="nd-field">
            <label htmlFor="nd-phone">Phone Number <span className="nd-optional">(optional)</span></label>
            <input id="nd-phone" name="phone" type="tel"
              placeholder="+91 xxxxxxxxxx" value={form.phone} onChange={handleChange}
              className={errors.phone ? 'nd-input nd-input-error' : 'nd-input'} />
            {errors.phone && <span className="nd-error">{errors.phone}</span>}
          </div>

          {/* Email */}
          <div className="nd-field">
            <label htmlFor="nd-email">Email <span className="nd-optional">(optional)</span></label>
            <input id="nd-email" name="email" type="email"
              placeholder="doctor@example.com" value={form.email} onChange={handleChange}
              className={errors.email ? 'nd-input nd-input-error' : 'nd-input'} />
            {errors.email && <span className="nd-error">{errors.email}</span>}
          </div>

          {/* State */}
          <div className="nd-field" ref={stateRef}>
            <label htmlFor="nd-state">State *</label>
            <div style={{ position: 'relative' }}>
              <input id="nd-state" name="state" type="text"
                placeholder="State" value={form.state} 
                onChange={(e) => { handleChange(e); setShowStateSug(true); setForm(f => ({...f, city: ''})); }}
                onFocus={() => setShowStateSug(true)}
                className={errors.state ? 'nd-input nd-input-error' : 'nd-input'} autoComplete="off" />
              {showStateSug && indiaStates.filter(s => s.toLowerCase().includes(form.state.toLowerCase())).length > 0 && (
                <div className="ed-suggestions">
                  {indiaStates.filter(s => s.toLowerCase().includes(form.state.toLowerCase())).map(s => (
                    <div key={s} className="ed-suggestion-item" onClick={() => { setForm(f => ({...f, state: s})); setShowStateSug(false); setErrors(er => ({...er, state: undefined})); }}>
                      <span className="ed-sug-name">{s}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {errors.state && <span className="nd-error">{errors.state}</span>}
          </div>

          {/* City */}
          <div className="nd-field" ref={cityRef}>
            <label htmlFor="nd-city">City *</label>
            <div style={{ position: 'relative' }}>
              <input id="nd-city" name="city" type="text"
                placeholder="City / Village" value={form.city} 
                onChange={(e) => { handleChange(e); setShowCitySug(true); }}
                onFocus={() => setShowCitySug(true)}
                disabled={!form.state}
                className={errors.city ? 'nd-input nd-input-error' : 'nd-input'} autoComplete="off" />
              {showCitySug && indiaCities.filter(c => c.toLowerCase().includes(form.city.toLowerCase())).length > 0 && (
                <div className="ed-suggestions">
                  {indiaCities.filter(c => c.toLowerCase().includes(form.city.toLowerCase())).slice(0, 50).map(c => (
                    <div key={c} className="ed-suggestion-item" onClick={() => { setForm(f => ({...f, city: c})); setShowCitySug(false); setErrors(er => ({...er, city: undefined})); }}>
                      <span className="ed-sug-name">{c}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {errors.city && <span className="nd-error">{errors.city}</span>}
          </div>

          {/* Sub Locality */}
          <div className="nd-field">
            <label htmlFor="nd-subLocality">Sub Locality <span className="nd-optional">(optional)</span></label>
            <input id="nd-subLocality" name="subLocality" type="text"
              placeholder="Local Area / Road / Street" value={form.subLocality} onChange={handleChange}
              className={errors.subLocality ? 'nd-input nd-input-error' : 'nd-input'} />
            {errors.subLocality && <span className="nd-error">{errors.subLocality}</span>}
          </div>

          {/* Degree Type */}
          <div className="nd-field">
            <label htmlFor="nd-degreeType">Type of Degree (Doctor Type) *</label>
            <select id="nd-degreeType" name="degreeType" value={form.degreeType}
              onChange={handleChange}
              className={errors.degreeType ? 'nd-input nd-select nd-input-error' : 'nd-input nd-select'}>
              <option value="">Select Degree…</option>
              {DEGREE_TYPES.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            {errors.degreeType && <span className="nd-error">{errors.degreeType}</span>}
          </div>

          {/* Specialization */}
          <div className="nd-field">
            <label htmlFor="nd-specialization">Specialization <span className="nd-optional">(optional)</span></label>
            <input id="nd-specialization" name="specialization" type="text" list="specialization-list"
              placeholder="Specilization " value={form.specialization} onChange={handleChange}
              className={errors.specialization ? 'nd-input nd-input-error' : 'nd-input'} autoComplete="off" />
            <datalist id="specialization-list">
              {SPECIALIZATIONS.map(s => <option key={s} value={s} />)}
            </datalist>
            {errors.specialization && <span className="nd-error">{errors.specialization}</span>}
          </div>

          {/* Visit Day */}
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
                          // Keep the days in standard order
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

          {/* Grade */}
          <div className="nd-field">
            <label htmlFor="nd-grade">Grade *</label>
            <select id="nd-grade" name="grade" value={form.grade}
              onChange={handleChange}
              className={errors.grade ? 'nd-input nd-select nd-input-error' : 'nd-input nd-select'}>
              <option value="">Select Grade…</option>
              <option value="A">Grade A</option>
              <option value="B">Grade B</option>
              <option value="C">Grade C</option>
              <option value="D">Grade D</option>
            </select>
            {errors.grade && <span className="nd-error">{errors.grade}</span>}
          </div>

        </div>

        {/* Default product note */}
        {/* <div className="nd-default-product-note">
          <span>🔗 Default product <strong>{DEFAULT_PRODUCT.name}</strong> will be auto-linked to this doctor.</span>
        </div> */}

        {errors.submit && <div className="nd-submit-error">{errors.submit}</div>}

        <div className="nd-form-actions">
          <button type="button" className="nd-cancel-btn" onClick={() => navigateTo('doctors')}>
            Cancel
          </button>
          <button type="submit" className="nd-submit-btn" disabled={loading}>
            {loading ? <span className="nd-btn-spinner" /> : <UserPlus size={18} />}
            {loading ? 'Saving…' : 'Add Doctor'}
          </button>
        </div>
      </form>
    </div>
  );
}
export default NewDoctorPage;