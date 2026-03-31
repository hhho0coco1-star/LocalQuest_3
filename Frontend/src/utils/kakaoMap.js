const KAKAO_MAP_SCRIPT_SELECTOR = 'script[data-kakao-map-sdk="true"]';

export const hasValidCoordinates = (location) =>
  Number.isFinite(Number(location?.latitude)) && Number.isFinite(Number(location?.longitude));

export const loadKakaoMapSdk = (appKey, options = {}) =>
  new Promise((resolve, reject) => {
    const { libraries = '' } = options;

    if (!appKey) {
      reject(new Error('missing-key'));
      return;
    }

    if (window.kakao?.maps?.LatLng) {
      resolve(window.kakao);
      return;
    }

    const handleReady = () => {
      if (window.kakao?.maps?.LatLng) {
        resolve(window.kakao);
        return;
      }

      if (window.kakao?.maps?.load) {
        window.kakao.maps.load(() => {
          if (window.kakao?.maps?.LatLng) {
            resolve(window.kakao);
            return;
          }

          reject(new Error('sdk-load-failed'));
        });
        return;
      }

      reject(new Error('sdk-load-failed'));
    };

    const existingScript = document.querySelector(KAKAO_MAP_SCRIPT_SELECTOR);
    if (existingScript) {
      if (existingScript.getAttribute('data-loaded') === 'true') {
        handleReady();
        return;
      }

      existingScript.addEventListener('load', handleReady, { once: true });
      existingScript.addEventListener('error', () => reject(new Error('sdk-load-failed')), {
        once: true,
      });
      return;
    }

    const query = libraries ? `&libraries=${encodeURIComponent(libraries)}` : '';
    const script = document.createElement('script');
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false${query}`;
    script.async = true;
    script.setAttribute('data-kakao-map-sdk', 'true');
    script.addEventListener(
      'load',
      () => {
        script.setAttribute('data-loaded', 'true');
        handleReady();
      },
      { once: true }
    );
    script.addEventListener('error', () => reject(new Error('sdk-load-failed')), { once: true });
    document.head.appendChild(script);
  });

