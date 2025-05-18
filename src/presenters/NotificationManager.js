// NotificationManager.js
import StoryModel from '../models/StoryModel.js';

const VAPID_PUBLIC_KEY = 'BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return new Uint8Array([...rawData].map(char => char.charCodeAt(0)));
}

function encodeBase64(buffer) {
  return btoa(String.fromCharCode.apply(null, new Uint8Array(buffer)));
}

const storyModel = new StoryModel();

async function initPushManager(token) {
  console.log('initPushManager called');
  if (!('serviceWorker' in navigator)) {
    alert('Service Worker not supported in this browser.');
    console.error('Service Worker not supported');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.register('./sw.js');
    console.log('Service Worker registered:', registration);

    // Cek apakah sudah ada subscription
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
      console.log('New push subscription:', subscription);
    } else {
      console.log('Existing push subscription:', subscription);
    }

    const cleanedSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: encodeBase64(subscription.getKey('p256dh')),
        auth: encodeBase64(subscription.getKey('auth')),
      },
    };

    storyModel.token = token;
    const response = await storyModel.subscribeToNotification(cleanedSubscription);
    console.log('Subscribed response:', response);

    alert('Subscribed Successfully!');
  } catch (error) {
    console.error('Error during subscribe:', error);
    alert('Subscription failed: ' + error.message);
  }
}

async function unsubscribePushManager(token) {
  console.log('unsubscribePushManager called');
  try {
    const registration = await navigator.serviceWorker.ready;
    console.log('Service Worker ready:', registration);

    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      const cleanedSubscription = {
        endpoint: subscription.endpoint,
      };

      storyModel.token = token;
      const response = await storyModel.unsubscribeFromNotification(cleanedSubscription);
      console.log('Unsubscribe response:', response);

      await subscription.unsubscribe();
      console.log('Unsubscribed from push service');
      alert('Unsubscribed Successfully!');
    } else {
      alert('No active subscription found.');
      console.log('No subscription found to unsubscribe.');
    }
  } catch (error) {
    console.error('Error during unsubscribe:', error);
    alert('Unsubscribe failed: ' + error.message);
  }
}

// NotificationManager.js

// Handler dideklarasikan di luar agar referensinya tetap sama saat removeEventListener
let subscribeHandler = null;
let unsubscribeHandler = null;

function setupNotificationButtons(token) {
  const subscribeBtn = document.getElementById('subscribeButton');
  const unsubscribeBtn = document.getElementById('unsubscribeButton');

  if (!subscribeBtn || !unsubscribeBtn) {
    console.error('Subscribe or Unsubscribe button not found in DOM.');
    alert('Subscription buttons missing in page.');
    return;
  }

  // Jika sudah ada handler, hapus dulu event listener lama
  if (subscribeHandler) {
    subscribeBtn.removeEventListener('click', subscribeHandler);
  }
  if (unsubscribeHandler) {
    unsubscribeBtn.removeEventListener('click', unsubscribeHandler);
  }

  // Definisikan handler baru
  subscribeHandler = async () => {
    console.log('Subscribe button clicked');
    await initPushManager(token);
  };

  unsubscribeHandler = async () => {
    console.log('Unsubscribe button clicked');
    await unsubscribePushManager(token);
  };

  // Pasang event listener dengan handler baru
  subscribeBtn.addEventListener('click', subscribeHandler);
  unsubscribeBtn.addEventListener('click', unsubscribeHandler);
}

export { setupNotificationButtons };
