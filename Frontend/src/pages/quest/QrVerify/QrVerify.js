import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { clearAuth } from '../../../store/authSlice';
import { emitBadgeAchievedEvent } from '../../reward/badge/badgeToastEvent';
import './QrVerify.css';

const readResponseBody = async (response) => {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json();
  }

  const text = await response.text();
  return { message: text };
};

function QrVerify() {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [status, setStatus] = useState('loading');
  const [result, setResult] = useState(null);
  const [message, setMessage] = useState('');

  const qrAuthKey = useMemo(() => {
    const searchParams = new URLSearchParams(location.search);
    return (searchParams.get('key') || searchParams.get('qrAuthKey') || '').trim();
  }, [location.search]);

  useEffect(() => {
    let cancelled = false;

    const verifyQr = async () => {
      if (!qrAuthKey) {
        setStatus('error');
        setMessage('유효한 QR 인증키가 없습니다.');
        return;
      }

      setStatus('loading');
      setMessage('');

      try {
        const response = await fetch(`/api/qr/verify?qrAuthKey=${encodeURIComponent(qrAuthKey)}`, {
          method: 'POST',
          credentials: 'same-origin',
          headers: {
            'X-Requested-With': 'XMLHttpRequest',
          },
        });

        if (response.status === 401) {
          dispatch(clearAuth());
          navigate(`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`, { replace: true });
          return;
        }

        const payload = await readResponseBody(response);
        if (!response.ok) {
          throw new Error(payload?.message || 'QR 인증 처리 중 오류가 발생했습니다.');
        }

        if (cancelled) {
          return;
        }

        setResult(payload);
        setMessage(payload?.message || 'QR 인증이 완료되었습니다.');
        emitBadgeAchievedEvent(payload?.newlyAwardedBadges, {
          source: 'qr-verify',
          requestUrl: '/api/qr/verify'
        });

        if ((payload?.verifiedQuestCount || 0) > 0 || (payload?.completedQuestCount || 0) > 0) {
          setStatus('success');
          return;
        }

        setStatus('idle');
      } catch (error) {
        if (cancelled) {
          return;
        }

        setStatus('error');
        setMessage(error.message || 'QR 인증 처리 중 오류가 발생했습니다.');
      }
    };

    verifyQr();

    return () => {
      cancelled = true;
    };
  }, [dispatch, location.pathname, location.search, navigate, qrAuthKey]);

  return (
    <div className="qr-verify-page">
      <div className="qr-verify-panel">
        <span className="qr-verify-eyebrow">QR VERIFY</span>

        {status === 'loading' && (
          <>
            <h1>QR을 확인하고 있습니다.</h1>
            <p>잠시만 기다려 주세요. 해당 장소 인증과 퀘스트 진행 상태를 확인 중입니다.</p>
          </>
        )}

        {status !== 'loading' && (
          <>
            <h1>
              {status === 'success' && 'QR 인증이 반영되었습니다.'}
              {status === 'idle' && '인증 결과를 확인해 주세요.'}
              {status === 'error' && 'QR 인증에 실패했습니다.'}
            </h1>
            <p>{message || '인증 결과를 불러오는 중입니다.'}</p>
          </>
        )}

        {result && Array.isArray(result.results) && result.results.length > 0 && (
          <div className="qr-verify-results">
            {result.results.map((item) => (
              <article
                key={`${item.userQuestId || 0}-${item.questId || 0}-${item.locationId || 0}`}
                className={`qr-verify-result-card${item.questCompleted ? ' is-completed' : ''}`}
              >
                <div className="qr-verify-result-head">
                  <strong>{item.questTitle || '진행 중 퀘스트'}</strong>
                  <span>{item.questCompleted ? '퀘스트 완료' : (item.status || '진행 중')}</span>
                </div>
                <p>{item.locationName ? `${item.locationName} 인증` : '장소 인증'}</p>
                <div className="qr-verify-result-meta">
                  <span>완료 {item.completedCount ?? 0} / {item.totalCount ?? 0}</span>
                  <span>남음 {item.remainingCount ?? 0}</span>
                </div>
                {item.message && <small>{item.message}</small>}
              </article>
            ))}
          </div>
        )}

        <div className="qr-verify-actions">
          <Link to="/main" className="qr-verify-link">메인으로</Link>
          <Link to="/quest" className="qr-verify-link is-primary">내 퀘스트 보기</Link>
        </div>
      </div>
    </div>
  );
}

export default QrVerify;
