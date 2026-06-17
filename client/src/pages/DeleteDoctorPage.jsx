import React, { useState, useEffect } from 'react';
import { ArrowLeft, Trash2, AlertTriangle, RefreshCw } from 'lucide-react';

/* ── CAPTCHA helpers ──────────────────────────────────────────────── */
const CAPTCHA_CHARS =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz123456789';
// const CAPTCHA_CHARS =
//   'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz123456789' +
//   '!@#$%^&*()_+-=[]{}|;:,.<>?';

function generateCaptcha(len = 6) {
  return Array.from({ length: len }, () =>
    CAPTCHA_CHARS[Math.floor(Math.random() * CAPTCHA_CHARS.length)]
  ).join('');
}

/* ── Component ────────────────────────────────────────────────────── */
function DeleteDoctorPage({ navigateTo, BACKEND_URL }) {
  const [doctors,     setDoctors]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [modal,       setModal]       = useState(null);   // { doctor } or null
  const [captcha,     setCaptcha]     = useState('');
  const [userInput,   setUserInput]   = useState('');
  const [captchaErr,  setCaptchaErr]  = useState('');
  const [deleting,    setDeleting]    = useState(false);
  const [deleteMsg,   setDeleteMsg]   = useState('');

  useEffect(() => { fetchDoctors(); }, []);

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${BACKEND_URL}/api/doctors`);
      const data = await res.json();
      setDoctors(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  /* open confirmation modal */
  const openModal = (doctor) => {
    setCaptcha(generateCaptcha());
    setUserInput('');
    setCaptchaErr('');
    setDeleteMsg('');
    setModal({ doctor });
  };

  const closeModal = () => { setModal(null); setCaptchaErr(''); };

  const refreshCaptcha = () => {
    setCaptcha(generateCaptcha());
    setUserInput('');
    setCaptchaErr('');
  };

  const handleDelete = async () => {
    if (userInput !== captcha) {
      setCaptchaErr('❌ Wrong CAPTCHA. Please try again.');
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/doctors/${modal.doctor._id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete');
      setDoctors(prev => prev.filter(d => d._id !== modal.doctor._id));
      setDeleteMsg(`✅ Dr. ${modal.doctor.name} deleted successfully.`);
      setModal(null);
    } catch (err) {
      setCaptchaErr('Server error. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="dd-page">
      {/* Header */}
      <div className="dd-header">
        <button className="nd-back-btn" onClick={() => navigateTo('doctors')}>
          <ArrowLeft size={18} /> Back to Doctors
        </button>
        <div className="nd-title">
          <Trash2 size={26} className="dd-icon" />
          <h2>Delete Doctor</h2>
        </div>
      </div>

      {deleteMsg && <div className="dd-success-msg">{deleteMsg}</div>}

      {loading ? (
        <div className="dp-loading"><div className="dp-spinner" /><p>Loading…</p></div>
      ) : doctors.length === 0 ? (
        <div className="dp-empty"><p>No doctors in the list.</p></div>
      ) : (
        <div className="dd-list">
          {doctors.map(doc => (
            <div key={doc._id} className="dd-list-item">
              <div className="dd-list-avatar">{doc.name.charAt(0).toUpperCase()}</div>
              <div className="dd-list-info">
                <p className="dd-list-name">{doc.name}</p>
                <p className="dd-list-meta">{doc.degreeType} · {doc.city}, {doc.state}</p>
                <p className="dd-list-meta">📞 {doc.phone}</p>
              </div>
              <button className="dd-delete-btn" onClick={() => openModal(doc)}>
                <Trash2 size={16} /> Delete
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── Confirmation Modal ── */}
      {modal && (
        <div className="dd-modal-overlay" onClick={closeModal}>
          <div className="dd-modal" onClick={e => e.stopPropagation()}>
            <div className="dd-modal-icon">
              <AlertTriangle size={40} />
            </div>
            <h3 className="dd-modal-title">Confirm Deletion</h3>
            <p className="dd-modal-body">
              You are about to permanently delete <strong>{modal.doctor.name}</strong> and all their data.
              This action cannot be undone.
            </p>

            {/* CAPTCHA */}
            <div className="dd-captcha-section">
              <label className="dd-captcha-label">
                Type the CAPTCHA below to confirm:
              </label>
              <div className="dd-captcha-display">
                <span className="dd-captcha-text">{captcha}</span>
                <button
                  type="button"
                  className="dd-captcha-refresh"
                  onClick={refreshCaptcha}
                  title="Refresh CAPTCHA"
                >
                  <RefreshCw size={15} />
                </button>
              </div>
              <input
                type="text"
                className={`nd-input dd-captcha-input${captchaErr ? ' nd-input-error' : ''}`}
                placeholder="Enter CAPTCHA exactly…"
                value={userInput}
                onChange={e => { setUserInput(e.target.value); setCaptchaErr(''); }}
                autoComplete="off"
                spellCheck="false"
              />
              {captchaErr && <span className="nd-error">{captchaErr}</span>}
            </div>

            <div className="dd-modal-actions">
              <button className="dd-modal-cancel" onClick={closeModal}>Cancel</button>
              <button
                className="dd-modal-confirm"
                onClick={handleDelete}
                disabled={deleting || !userInput}
              >
                {deleting ? <span className="nd-btn-spinner" /> : <Trash2 size={16} />}
                {deleting ? 'Deleting…' : 'Delete Doctor'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DeleteDoctorPage;
