const toBase64 = (arrayBuffer) => {
  if (!arrayBuffer) {
    return '';
  }

  const bytes = new Uint8Array(arrayBuffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }

  return window.btoa(binary);
};

export const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
};

const getDeviceType = () => {
  const ua = window.navigator.userAgent || '';
  return /Android|iPhone|iPad|iPod|Mobile/i.test(ua) ? 'MOBILE' : 'PC';
};

const getBrowserName = () => {
  const ua = window.navigator.userAgent || '';

  if (ua.includes('Edg/')) return 'EDGE';
  if (ua.includes('Chrome/')) return 'CHROME';
  if (ua.includes('Safari/') && !ua.includes('Chrome/')) return 'SAFARI';
  if (ua.includes('Firefox/')) return 'FIREFOX';
  return 'OTHER';
};

export const toSubscriptionPayload = (subscription) => {
  const endpoint = subscription?.endpoint || '';
  const p256dhKey = toBase64(subscription?.getKey?.('p256dh'));
  const authKey = toBase64(subscription?.getKey?.('auth'));

  return {
    endpoint,
    p256dhKey,
    authKey,
    deviceType: getDeviceType(),
    browserName: getBrowserName(),
    userAgent: window.navigator.userAgent || '',
  };
};
