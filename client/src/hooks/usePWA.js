/**
 * usePWA – Custom React hook for PWA install prompt and SW lifecycle.
 *
 * Exposes:
 *  - isInstallable  : boolean – true when browser fires beforeinstallprompt
 *  - isInstalled    : boolean – true when app is running in standalone mode
 *  - isOffline      : boolean – network status
 *  - isUpdateReady  : boolean – new SW version is waiting
 *  - promptInstall  : fn      – call to trigger the native install dialog
 *  - dismissInstall : fn      – hide the install prompt permanently this session
 *  - applyUpdate    : fn      – reload to apply the waiting SW update
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export function usePWA() {
  const [isInstallable,  setIsInstallable]  = useState(false);
  const [isInstalled,    setIsInstalled]    = useState(false);
  const [isOffline,      setIsOffline]      = useState(!navigator.onLine);
  const [isUpdateReady,  setIsUpdateReady]  = useState(false);
  const deferredPrompt = useRef(null);
  const waitingSW      = useRef(null);

  // ── Detect standalone mode ────────────────────────────────────────────────
  useEffect(() => {
    const mq = window.matchMedia('(display-mode: standalone)');
    setIsInstalled(mq.matches || window.navigator.standalone === true);
    const handler = (e) => setIsInstalled(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // ── Capture beforeinstallprompt ───────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      deferredPrompt.current = e;
      setIsInstallable(true);
    };
    window.addEventListener('beforeinstallprompt', handler);

    const installed = () => {
      setIsInstallable(false);
      deferredPrompt.current = null;
    };
    window.addEventListener('appinstalled', installed);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installed);
    };
  }, []);

  // ── Network status ────────────────────────────────────────────────────────
  useEffect(() => {
    const onOnline  = () => setIsOffline(false);
    const onOffline = () => setIsOffline(true);
    window.addEventListener('online',  onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online',  onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  // ── Service Worker update detection ──────────────────────────────────────
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    // vite-plugin-pwa (generateSW) registers the SW automatically via registerSW.js.
    // We only listen for updates here; no manual register() needed.
    navigator.serviceWorker.ready.then((reg) => {
      reg.addEventListener('updatefound', () => {
        const newSW = reg.installing;
        if (!newSW) return;
        newSW.addEventListener('statechange', () => {
          if (newSW.state === 'installed' && navigator.serviceWorker.controller) {
            waitingSW.current = newSW;
            setIsUpdateReady(true);
          }
        });
      });
    });
  }, []);

  // ── Actions ───────────────────────────────────────────────────────────────
  const promptInstall = useCallback(async () => {
    if (!deferredPrompt.current) return;
    deferredPrompt.current.prompt();
    const { outcome } = await deferredPrompt.current.userChoice;
    if (outcome === 'accepted') {
      deferredPrompt.current = null;
      setIsInstallable(false);
    }
  }, []);

  const dismissInstall = useCallback(() => {
    setIsInstallable(false);
  }, []);

  const applyUpdate = useCallback(() => {
    if (waitingSW.current) {
      waitingSW.current.postMessage({ type: 'SKIP_WAITING' });
    }
    window.location.reload();
  }, []);

  return { isInstallable, isInstalled, isOffline, isUpdateReady, promptInstall, dismissInstall, applyUpdate };
}
