import { pushApi } from '../api/PushApi';
import { toSubscriptionPayload, urlBase64ToUint8Array } from './pushSubscription';
import { getServiceWorkerRegistration } from './serviceWorkerRegistration';

export const parseYnToBoolean = (value) => {
  if (typeof value === 'boolean') {
    return value;
  }

  const normalized = String(value ?? '').trim().toUpperCase();
  return normalized === 'Y' || normalized === 'TRUE' || normalized === '1';
};

export const isPushSupported = () => (
  typeof window !== 'undefined' &&
  'serviceWorker' in navigator &&
  'PushManager' in window &&
  'Notification' in window
);

const getRegistrationAndSubscription = async () => {
  const registration = await getServiceWorkerRegistration();
  const subscription = await registration?.pushManager?.getSubscription();
  return { registration, subscription };
};

const loadPushConfig = async () => {
  const configResponse = await pushApi.getConfig();
  return configResponse?.data || {};
};

export const ensurePushSubscriptionForCurrentDevice = async ({ requestPermission = false } = {}) => {
  if (!isPushSupported()) {
    if (requestPermission) {
      throw new Error('현재 브라우저에서는 푸시 알림을 지원하지 않습니다.');
    }
    return null;
  }

  const { registration, subscription: existingSubscription } = await getRegistrationAndSubscription();
  if (!registration) {
    if (requestPermission) {
      throw new Error('서비스워커를 등록하지 못했습니다.');
    }
    return null;
  }

  let permission = window.Notification.permission;
  if (permission !== 'granted' && requestPermission) {
    permission = await window.Notification.requestPermission();
  }
  if (permission !== 'granted') {
    if (requestPermission) {
      throw new Error('알림 권한이 허용되지 않아 푸시를 켤 수 없습니다.');
    }
    return null;
  }

  let subscription = existingSubscription;
  if (!subscription) {
    const config = await loadPushConfig().catch(() => null);
    if (!config?.enabled || !config?.publicKey) {
      if (requestPermission) {
        throw new Error('서버의 푸시 설정이 완료되지 않았습니다.');
      }
      return null;
    }

    try {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(config.publicKey),
      });
    } catch (error) {
      if (requestPermission) {
        throw new Error('푸시 구독 생성에 실패했습니다.');
      }
      return null;
    }
  }

  await pushApi.saveSubscription(toSubscriptionPayload(subscription));
  return subscription;
};

export const deactivatePushSubscriptionForCurrentDevice = async () => {
  if (!isPushSupported()) {
    return;
  }

  const { subscription } = await getRegistrationAndSubscription();
  const endpoint = subscription?.endpoint;

  if (subscription) {
    try {
      await subscription.unsubscribe();
    } catch (error) {
      // Keep server sync flow even if browser unsubscribe fails.
    }
  }

  if (endpoint) {
    await pushApi.deactivateSubscription(endpoint).catch(() => null);
  }
};

export const syncPushSubscriptionByServerSetting = async () => {
  if (!isPushSupported()) {
    return;
  }

  const settingsResponse = await pushApi.getSettings().catch(() => null);
  const pushAgree = parseYnToBoolean(settingsResponse?.data?.pushAgree);

  if (!pushAgree) {
    await deactivatePushSubscriptionForCurrentDevice();
    return;
  }

  await ensurePushSubscriptionForCurrentDevice({ requestPermission: false });
};

