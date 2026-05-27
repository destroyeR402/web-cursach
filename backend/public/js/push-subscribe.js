(function () {
  'use strict';

  async function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
    return outputArray;
  }

  async function registerPush() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return console.log('Push not supported');
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      console.log('Service worker registered', reg);
      const resp = await fetch('/client/api/push-vapid');
      const data = await resp.json();
      const publicKey = data.data && data.data.publicKey ? data.data.publicKey : '';
      if (!publicKey) return console.log('VAPID public key not configured on server');
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: await urlBase64ToUint8Array(publicKey) });
      await fetch('/client/api/push-subscription', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(sub) });
      console.log('Push subscription saved');
    } catch (err) { console.error('Push registration failed', err); }
  }

  // auto-run
  if (document.readyState === 'complete' || document.readyState === 'interactive') registerPush();
  else window.addEventListener('DOMContentLoaded', registerPush);
}());
