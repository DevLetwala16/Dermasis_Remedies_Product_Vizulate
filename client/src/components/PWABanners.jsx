/**
 * PWABanners – Renders three unobtrusive UI overlays:
 *  1. InstallBanner  – "Add to Home Screen" prompt (bottom slide-up)
 *  2. OfflineToast   – network lost notification (top-right)
 *  3. UpdateToast    – new version available (top-right)
 *
 * All animations are CSS-only (no extra dependencies).
 */

import { useEffect, useState } from 'react';
import { usePWA } from '../hooks/usePWA.js';

/* ─── Inline styles (no class name collisions, zero extra CSS file) ────────── */
const styles = {
  /* Install banner – slides up from bottom */
  installBanner: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    background: 'linear-gradient(135deg, #0a1628 0%, #0f2040 100%)',
    borderTop: '1px solid rgba(13,148,136,0.4)',
    boxShadow: '0 -8px 32px rgba(0,0,0,0.4)',
    padding: '16px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    animation: 'dermasisSlideUp 0.4s cubic-bezier(0.16,1,0.3,1)',
  },
  installIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    flexShrink: 0,
    objectFit: 'cover',
  },
  installText: {
    flex: 1,
    minWidth: 0,
  },
  installTitle: {
    margin: 0,
    fontSize: '15px',
    fontWeight: 600,
    color: '#e2e8f0',
    lineHeight: 1.3,
  },
  installSub: {
    margin: '2px 0 0',
    fontSize: '12px',
    color: '#94a3b8',
    lineHeight: 1.4,
  },
  installActions: {
    display: 'flex',
    gap: '8px',
    flexShrink: 0,
  },
  btnInstall: {
    padding: '9px 18px',
    borderRadius: '8px',
    border: 'none',
    background: 'linear-gradient(135deg, #0d9488 0%, #059669 100%)',
    color: '#fff',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    letterSpacing: '0.02em',
    transition: 'transform 0.15s, box-shadow 0.15s',
    boxShadow: '0 2px 8px rgba(13,148,136,0.4)',
  },
  btnDismiss: {
    padding: '9px 14px',
    borderRadius: '8px',
    border: '1px solid rgba(148,163,184,0.25)',
    background: 'transparent',
    color: '#94a3b8',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'color 0.15s, border-color 0.15s',
  },
  /* Toasts */
  toast: {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    display: 'flex',
    alignItems: 'center',
    padding: '12px 16px',
    borderRadius: '8px',
    backgroundColor: '#323232',
    color: '#ffffff',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    fontFamily: 'sans-serif',
    zIndex: 1000,
    animation: 'dermasisFadeIn 0.35s ease',
  },
  offlineToast: {
    borderLeft: '4px solid #f44336', // Example accent color
  },
  updateToast: {
    background: 'linear-gradient(135deg, #1a2e1a 0%, #14532d 100%)',
    border: '1px solid rgba(34,197,94,0.4)',
    color: '#bbf7d0',
  },
  toastIcon: {
    marginRight: '12px',
    fontSize: '20px',
  },
  toastBody: {
    flexGrow: 1,
    marginRight: '24px', // Gives space so text doesn't hit the 'X'
  },
  toastTitle: {
    fontWeight: 'bold',
    marginBottom: '2px',
  },
  toastMsg: {
    fontSize: '13px',
    opacity: 0.9,
  },
  /* Added Close Button Styles */
  closeButton: {
    background: 'none',
    border: 'none',
    color: 'inherit',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
    padding: '4px 8px',
    opacity: 0.7,
    transition: 'opacity 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toastBtn: {
    marginTop: '8px',
    padding: '5px 12px',
    borderRadius: '6px',
    border: 'none',
    background: 'rgba(255,255,255,0.15)',
    color: 'inherit',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background 0.15s',
  },
};

/* ─── Keyframe injector (once per page) ──────────────────────────────────────*/
function injectKeyframes() {
  if (document.getElementById('dermasis-pwa-keyframes')) return;
  const style = document.createElement('style');
  style.id = 'dermasis-pwa-keyframes';
  style.textContent = `
    @keyframes dermasisSlideUp {
      from { transform: translateY(100%); opacity: 0; }
      to   { transform: translateY(0);    opacity: 1; }
    }
    @keyframes dermasisFadeIn {
      from { transform: translateX(20px); opacity: 0; }
      to   { transform: translateX(0);    opacity: 1; }
    }
  `;
  document.head.appendChild(style);
}

/* ─── Install Banner ─────────────────────────────────────────────────────────*/
function InstallBanner({ onInstall, onDismiss }) {
  useEffect(() => { injectKeyframes(); }, []);

  return (
    <div style={styles.installBanner} role="banner" aria-label="Install Dermasis app">
      <img src="/pwa-192.png" alt="Dermasis icon" style={styles.installIcon} />
      <div style={styles.installText}>
        <p style={styles.installTitle}>Install Dermasis Remedies</p>
        <p style={styles.installSub}>Add to your home screen for quick access — works offline too.</p>
      </div>
      <div style={styles.installActions}>
        <button
          id="pwa-install-btn"
          style={styles.btnInstall}
          onClick={onInstall}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.04)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(13,148,136,0.55)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)';    e.currentTarget.style.boxShadow = '0 2px 8px rgba(13,148,136,0.4)'; }}
        >
          Install
        </button>
        <button
          id="pwa-dismiss-btn"
          style={styles.btnDismiss}
          onClick={onDismiss}
          aria-label="Dismiss install prompt"
          onMouseEnter={(e) => { e.currentTarget.style.color = '#e2e8f0'; e.currentTarget.style.borderColor = 'rgba(148,163,184,0.5)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.borderColor = 'rgba(148,163,184,0.25)'; }}
        >
          Not now
        </button>
      </div>
    </div>
  );
}

/* ─── Offline Toast ──────────────────────────────────────────────────────────*/
function OfflineToast() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => { 
    if (typeof injectKeyframes === 'function') {
      injectKeyframes(); 
    }
  }, []);

  // If the user closed the toast, don't render anything
  if (!isVisible) return null;

  return (
    <div style={{ ...styles.toast, ...styles.offlineToast }} role="alert" aria-live="assertive">
      <span style={styles.toastIcon}>📡</span>
      <div style={styles.toastBody}>
        <div style={styles.toastTitle}>You're offline</div>
        <div style={styles.toastMsg}>Some content may be unavailable. Cached data is still accessible.</div>
      </div>
      {/* ─── Close Button ─── */}
      <button 
        onClick={() => setIsVisible(false)} 
        style={styles.closeButton}
        aria-label="Close notification"
      >
        ✕
      </button>
    </div>
  );
}

/* ─── Update Toast ───────────────────────────────────────────────────────────*/
function UpdateToast({ onApply }) {
  useEffect(() => { injectKeyframes(); }, []);
  return (
    <div style={{ ...styles.toast, ...styles.updateToast }} role="status" aria-live="polite">
      <span style={styles.toastIcon}>✨</span>
      <div style={styles.toastBody}>
        <div style={styles.toastTitle}>Update available</div>
        <div style={styles.toastMsg}>A new version of Dermasis is ready.</div>
        <button
          id="pwa-update-btn"
          style={styles.toastBtn}
          onClick={onApply}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.25)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; }}
        >
          Refresh & update
        </button>
      </div>
    </div>
  );
}

/* ─── Main export ────────────────────────────────────────────────────────────*/
export default function PWABanners() {
  const { isInstallable, isInstalled, isOffline, isUpdateReady, promptInstall, dismissInstall, applyUpdate } = usePWA();

  // Don't show install banner if app is already installed
  const showInstall = isInstallable && !isInstalled;

  return (
    <>
      {showInstall  && <InstallBanner onInstall={promptInstall} onDismiss={dismissInstall} />}
      {isOffline    && <OfflineToast />}
      {isUpdateReady && <UpdateToast onApply={applyUpdate} />}
    </>
  );
}
