import { useCallback, useEffect, useRef, useState } from 'react';

export function useBusinessToast() {
  const [toastMessage, setToastMessage] = useState('');
  const toastTimerRef = useRef(null);

  const showToast = useCallback((message) => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }

    setToastMessage(message);
    toastTimerRef.current = window.setTimeout(() => {
      setToastMessage('');
      toastTimerRef.current = null;
    }, 2600);
  }, []);

  useEffect(
    () => () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    },
    []
  );

  return {
    toastMessage,
    showToast
  };
}
