import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { clearAuth } from '../../store/authSlice';
import { userApi } from '../../api/UserApi';
import { buildBackendUrl } from '../../config/runtimeUrls';
import { pushApi } from '../../api/PushApi';
import { getServiceWorkerRegistration } from '../../push/serviceWorkerRegistration';
import { toSubscriptionPayload, urlBase64ToUint8Array } from '../../push/pushSubscription';
import LocalQuestLogo from './LocalQuestLogo';
import './Header.css';

const Header = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const user = useSelector((state) => state.auth.user);
  const adminPageUrl = buildBackendUrl('/admin');

  const userRole = user?.role ?? 'GUEST';
  const displayName =
    user?.nickname ?? user?.name ?? user?.userLoginId ?? user?.userId ?? '사용자';

  const isPushSupported = useMemo(() => {
    if (typeof window === 'undefined') {
      return false;
    }

    return (
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    );
  }, []);

  const [isPushEnabled, setIsPushEnabled] = useState(false);
  const [isPushBusy, setIsPushBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const syncPushStatus = async () => {
      if (!isAuthenticated || !isPushSupported) {
        if (!cancelled) {
          setIsPushEnabled(false);
        }
        return;
      }

      try {
        const registration = await getServiceWorkerRegistration();
        const subscription = await registration?.pushManager?.getSubscription();
        const enabled = Boolean(subscription) && window.Notification.permission === 'granted';

        if (!cancelled) {
          setIsPushEnabled(enabled);
        }
      } catch (error) {
        if (!cancelled) {
          setIsPushEnabled(false);
        }
      }
    };

    syncPushStatus();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, isPushSupported]);

  const handleLogout = async () => {
    try {
      await userApi.logout();
    } catch (error) {
      // Ignore logout API failure and clear client auth state anyway.
    } finally {
      dispatch(clearAuth());
      navigate('/main', { replace: true });
    }
  };

  const handleEnablePush = async () => {
    if (!isAuthenticated || !isPushSupported || isPushBusy) {
      return;
    }

    setIsPushBusy(true);

    try {
      const configResponse = await pushApi.getConfig();
      const config = configResponse?.data || {};

      if (!config.enabled || !config.publicKey) {
        alert('푸시 기능이 서버에서 아직 설정되지 않았습니다.');
        return;
      }

      const registration = await getServiceWorkerRegistration();
      if (!registration) {
        alert('서비스워커를 등록하지 못했습니다.');
        return;
      }

      let permission = window.Notification.permission;
      if (permission !== 'granted') {
        permission = await window.Notification.requestPermission();
      }

      if (permission !== 'granted') {
        alert('알림 권한이 허용되지 않아 푸시를 켤 수 없습니다.');
        setIsPushEnabled(false);
        return;
      }

      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(config.publicKey),
        });
      }

      await pushApi.saveSubscription(toSubscriptionPayload(subscription));
      await pushApi.saveSettings({
        pushAgree: true,
        marketingAgree: false,
        lunchPushAgree: true,
        dinnerPushAgree: true,
        weekendPushAgree: true,
      });

      setIsPushEnabled(true);
      alert('푸시 알림이 활성화되었습니다.');
    } catch (error) {
      const message = error?.response?.data?.message || '푸시 알림 활성화 중 오류가 발생했습니다.';
      alert(message);
    } finally {
      setIsPushBusy(false);
    }
  };

  const handleDisablePush = async () => {
    if (!isAuthenticated || !isPushSupported || isPushBusy) {
      return;
    }

    setIsPushBusy(true);

    try {
      const registration = await getServiceWorkerRegistration();
      const subscription = await registration?.pushManager?.getSubscription();
      const endpoint = subscription?.endpoint;

      if (subscription) {
        try {
          await subscription.unsubscribe();
        } catch (error) {
          // Ignore unsubscribe failure and continue with server-side disable.
        }
      }

      if (endpoint) {
        try {
          await pushApi.deactivateSubscription(endpoint);
        } catch (error) {
          // If endpoint sync fails, we still turn off user-level push agreement.
        }
      }

      await pushApi.saveSettings({ pushAgree: false });
      setIsPushEnabled(false);
      alert('푸시 알림이 해제되었습니다.');
    } catch (error) {
      const message = error?.response?.data?.message || '푸시 알림 해제 중 오류가 발생했습니다.';
      alert(message);
    } finally {
      setIsPushBusy(false);
    }
  };

  return (
    <div>
      <header className="header-main-container">
        <div className="header-top-section">
          <div className="header-inner">
            <Link to="/" className="header-logo-link">
              <LocalQuestLogo />
            </Link>

            <div className="header-utility-btns">
              {!isAuthenticated ? (
                <>
                  <Link to="/login" className="header-auth-btn">로그인</Link>
                  <Link to="/terms" className="header-signup-btn">회원가입</Link>
                </>
              ) : (
                <>
                  <span className="header-user-info">{displayName}님</span>
                  {isPushSupported && (
                    <button
                      type="button"
                      className="header-push-btn"
                      onClick={isPushEnabled ? handleDisablePush : handleEnablePush}
                      disabled={isPushBusy}
                    >
                      {isPushBusy ? '처리 중...' : isPushEnabled ? '알림 해제' : '알림 켜기'}
                    </button>
                  )}
                  <button className="header-auth-btn" onClick={handleLogout}>로그아웃</button>
                </>
              )}
            </div>
          </div>
        </div>

        <nav className="header-nav-bar">
          <div className="header-inner">
            <ul className="header-nav-list">
              <li className="header-nav-item">
                <Link to="/explore" className="header-nav-link">퀘스트 목록</Link>
              </li>
              <li className="header-nav-item">
                <Link to="/quest" className="header-nav-link">내 퀘스트</Link>
              </li>
              <li className="header-nav-item">
                <Link to="/reward" className="header-nav-link">상점 및 보상</Link>
              </li>

              {userRole === 'BUSINESS' && (
                <li className="header-nav-item">
                  <Link to="/business" className="header-nav-link">비즈니스</Link>
                </li>
              )}

              {userRole === 'ADMIN' && (
                <li className="header-nav-item">
                  <a href={adminPageUrl} className="header-nav-link">관리자 페이지</a>
                </li>
              )}

              {isAuthenticated && (
                <li className="header-nav-item">
                  <Link to="/mypage" className="header-nav-link">마이페이지</Link>
                </li>
              )}
            </ul>
          </div>
        </nav>
      </header>
      <div className="header-relative-space" />
    </div>
  );
};

export default Header;
