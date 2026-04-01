import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { businessInquiryApi } from '../../api/BusinessInquiryApi';
import './BusinessInquiryPage.css';

const POSTCODE_SCRIPT_SRC = 'https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
const KAKAO_MAP_SCRIPT_ATTR = 'data-business-inquiry-kakao';
const POSTCODE_SCRIPT_ATTR = 'data-business-inquiry-postcode';
const BUSINESS_INQUIRY_PENDING_USER_KEY = 'localquest_business_inquiry_pending_user_id';

const safeWriteBrowserStorage = (key, value) => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(key, value);
  } catch (error) {
    // ignore browser storage errors
  }
};

const INITIAL_FORM = {
  title: '',
  content: '',
  phone: '',
  zipCode: '',
  address: '',
  addressDetail: '',
  latitude: '',
  longitude: '',
};

const formatPhoneNumber = (value) => {
  const digits = String(value || '').replace(/\D/g, '').slice(0, 11);

  if (digits.length <= 3) {
    return digits;
  }

  if (digits.length <= 7) {
    return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  }

  return `${digits.slice(0, 3)}-${digits.slice(3, digits.length === 10 ? 6 : 7)}-${digits.slice(digits.length === 10 ? 6 : 7)}`;
};

const loadScript = (src, attributeName) =>
  new Promise((resolve, reject) => {
    const existingScript = document.querySelector(`script[${attributeName}="true"]`);

    if (existingScript) {
      if (existingScript.getAttribute('data-loaded') === 'true') {
        resolve();
        return;
      }

      const handleLoad = () => resolve();
      const handleError = () => reject(new Error(`failed to load ${src}`));

      existingScript.addEventListener('load', handleLoad, { once: true });
      existingScript.addEventListener('error', handleError, { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.setAttribute(attributeName, 'true');
    script.addEventListener(
      'load',
      () => {
        script.setAttribute('data-loaded', 'true');
        resolve();
      },
      { once: true }
    );
    script.addEventListener('error', () => reject(new Error(`failed to load ${src}`)), { once: true });
    document.head.appendChild(script);
  });

const loadKakaoMapServices = async (appKey) => {
  if (!appKey) {
    throw new Error('missing kakao map key');
  }

  if (window.kakao?.maps?.services?.Geocoder) {
    return;
  }

  await loadScript(
    `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false&libraries=services`,
    KAKAO_MAP_SCRIPT_ATTR
  );

  await new Promise((resolve, reject) => {
    if (!window.kakao?.maps?.load) {
      reject(new Error('kakao maps load is unavailable'));
      return;
    }

    window.kakao.maps.load(() => {
      if (window.kakao?.maps?.services?.Geocoder) {
        resolve();
        return;
      }

      reject(new Error('kakao geocoder is unavailable'));
    });
  });
};

function BusinessInquiryPage() {
  const navigate = useNavigate();
  const authUser = useSelector((state) => state.auth.user);
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

  const kakaoMapKey = process.env.REACT_APP_KAKAO_MAP_KEY;
  const isInquiryUserReady = isAuthenticated && Number(authUser?.userId) > 0;
  const memberName = authUser?.name || authUser?.nickname || '회원';
  const memberId =
    authUser?.userLoginId ||
    authUser?.email ||
    (authUser?.userId ? `USER-${authUser.userId}` : '-');

  const [form, setForm] = useState(INITIAL_FORM);
  const [isScriptReady, setIsScriptReady] = useState(false);
  const [scriptError, setScriptError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [submitMessage, setSubmitMessage] = useState('');
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    const prepareAddressTools = async () => {
      try {
        setScriptError('');
        await Promise.all([
          loadKakaoMapServices(kakaoMapKey),
          loadScript(POSTCODE_SCRIPT_SRC, POSTCODE_SCRIPT_ATTR),
        ]);

        if (!isCancelled) {
          setIsScriptReady(true);
        }
      } catch (error) {
        if (!isCancelled) {
          setScriptError('주소 검색 기능을 준비하지 못했습니다. 잠시 후 다시 시도해주세요.');
        }
      }
    };

    prepareAddressTools();

    return () => {
      isCancelled = true;
    };
  }, [kakaoMapKey]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === 'phone' ? formatPhoneNumber(value) : value,
    }));
  };

  const updateAddressCoordinates = (roadAddress, zipCode) => {
    const geocoder = new window.kakao.maps.services.Geocoder();

    geocoder.addressSearch(roadAddress, (result, status) => {
      if (
        status !== window.kakao.maps.services.Status.OK ||
        !Array.isArray(result) ||
        !result[0]
      ) {
        setSubmitError('선택한 도로명 주소의 좌표를 찾지 못했습니다. 다른 주소로 다시 시도해주세요.');
        setForm((prev) => ({
          ...prev,
          zipCode,
          address: roadAddress,
          latitude: '',
          longitude: '',
        }));
        return;
      }

      setSubmitError('');
      setForm((prev) => ({
        ...prev,
        zipCode,
        address: roadAddress,
        latitude: result[0].y,
        longitude: result[0].x,
      }));
    });
  };

  const handleAddressSearch = () => {
    if (!isScriptReady || !window.daum?.Postcode || !window.kakao?.maps?.services?.Geocoder) {
      setScriptError('주소 검색 기능이 아직 준비되지 않았습니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    setIsSearchingAddress(true);
    setScriptError('');
    setSubmitError('');

    new window.daum.Postcode({
      oncomplete: (data) => {
        const roadAddress = data.roadAddress || data.address || '';
        const zipCode = data.zonecode || '';

        setIsSearchingAddress(false);

        if (!roadAddress || !zipCode) {
          setSubmitError('도로명 주소를 다시 선택해주세요.');
          return;
        }

        updateAddressCoordinates(roadAddress, zipCode);
      },
      onclose: () => {
        setIsSearchingAddress(false);
      },
    }).open();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    if (!isInquiryUserReady) {
      navigate(`/login?redirect=${encodeURIComponent('/inquiry')}`);
      return;
    }

    const trimmedTitle = form.title.trim();
    const trimmedContent = form.content.trim();
    const trimmedPhone = form.phone.trim();
    const trimmedZipCode = form.zipCode.trim();
    const trimmedAddress = form.address.trim();
    const trimmedAddressDetail = form.addressDetail.trim();
    const latitude = Number(form.latitude);
    const longitude = Number(form.longitude);

    if (!trimmedTitle || !trimmedContent) {
      setSubmitError('상담 제목과 내용을 모두 입력해주세요.');
      return;
    }

    if (!/^01\d-\d{3,4}-\d{4}$/.test(trimmedPhone)) {
      setSubmitError('휴대폰번호를 정확히 입력해주세요.');
      return;
    }

    if (!trimmedZipCode || !trimmedAddress) {
      setSubmitError('도로명 주소와 우편번호를 먼저 선택해주세요.');
      return;
    }

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      setSubmitError('선택한 주소의 위도/경도를 확인할 수 없습니다. 주소를 다시 선택해주세요.');
      return;
    }

    setSubmitError('');
    setSubmitMessage('');

    try {
      setIsSubmitting(true);
      await businessInquiryApi.createInquiry({
        userId: authUser.userId,
        title: trimmedTitle,
        content: trimmedContent,
        phone: trimmedPhone,
        zipCode: trimmedZipCode,
        address: trimmedAddress,
        addressDetail: trimmedAddressDetail,
        latitude,
        longitude,
        locationType: 'ROAD_ADDRESS',
      });

      if (typeof window !== 'undefined' && Number(authUser?.userId) > 0) {
        safeWriteBrowserStorage(BUSINESS_INQUIRY_PENDING_USER_KEY, String(authUser.userId));
      }

      setForm(INITIAL_FORM);
      setSubmitMessage('비즈니스 상담 신청이 등록되었습니다. 관리자가 확인 후 순차적으로 연락드릴 예정입니다.');
    } catch (error) {
      const fallbackMessage = '비즈니스 상담 신청 등록에 실패했습니다. 잠시 후 다시 시도해주세요.';
      setSubmitError(error?.response?.data?.message || fallbackMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="business-inquiry-page">
      <section className="business-inquiry-hero">
        <span className="business-inquiry-chip">BUSINESS INQUIRY</span>
        <h1>비즈니스 상담 신청</h1>
        <p>
          우리 매장을 Local Quest 파트너 매장으로 등록하고 싶다면 상담 내용을 남겨주세요.
          매장 주소를 기준으로 운영 검토 후 순차적으로 안내드립니다.
        </p>
      </section>

      <section className="business-inquiry-card">
        <div className="business-inquiry-card-head">
          <div>
            <h2>상담 신청서</h2>
            <p>제목, 내용, 도로명 주소와 우편번호를 입력하면 좌표는 자동으로 계산되어 저장됩니다.</p>
          </div>
          <Link to="/main" className="business-inquiry-back-link">
            메인으로 돌아가기
          </Link>
        </div>

        {isInquiryUserReady ? (
          <div className="business-inquiry-member-box">
            <strong>{memberName}</strong>
            <span>{memberId}</span>
          </div>
        ) : (
          <div className="business-inquiry-login-box">
            <p>비즈니스 상담 신청은 로그인한 회원만 작성할 수 있습니다.</p>
            <button
              type="button"
              className="business-inquiry-login-btn"
              onClick={() => navigate(`/login?redirect=${encodeURIComponent('/inquiry')}`)}
            >
              로그인 하러 가기
            </button>
          </div>
        )}

        <form className="business-inquiry-form" onSubmit={handleSubmit}>
          <label className="business-inquiry-label" htmlFor="business-inquiry-title">
            상담 제목
          </label>
          <input
            id="business-inquiry-title"
            name="title"
            type="text"
            className="business-inquiry-input"
            placeholder="예: 우리 매장을 퀘스트 제휴 매장으로 등록하고 싶어요."
            value={form.title}
            onChange={handleChange}
          />

          <label className="business-inquiry-label" htmlFor="business-inquiry-content">
            상담 내용
          </label>
          <textarea
            id="business-inquiry-content"
            name="content"
            className="business-inquiry-textarea"
            placeholder="매장 소개, 상담 요청 내용, 기대 효과 등을 자세히 작성해주세요."
            value={form.content}
            onChange={handleChange}
          />

          <label className="business-inquiry-label" htmlFor="business-inquiry-phone">
            휴대폰번호
          </label>
          <input
            id="business-inquiry-phone"
            name="phone"
            type="text"
            inputMode="tel"
            className="business-inquiry-input"
            placeholder="010-1234-5678"
            value={form.phone}
            onChange={handleChange}
            maxLength={13}
          />

          <div className="business-inquiry-address-head">
            <label className="business-inquiry-label" htmlFor="business-inquiry-zipCode">
              매장 주소
            </label>
            <button
              type="button"
              className="business-inquiry-address-btn"
              onClick={handleAddressSearch}
              disabled={!isInquiryUserReady || isSearchingAddress}
            >
              {isSearchingAddress ? '주소 검색 중...' : '주소 검색'}
            </button>
          </div>

          <div className="business-inquiry-address-grid">
            <input
              id="business-inquiry-zipCode"
              name="zipCode"
              type="text"
              className="business-inquiry-input"
              placeholder="우편번호"
              value={form.zipCode}
              readOnly
            />
            <input
              name="address"
              type="text"
              className="business-inquiry-input business-inquiry-address-input"
              placeholder="도로명 주소"
              value={form.address}
              readOnly
            />
          </div>
          <p className="business-inquiry-helper-text">
          
          </p>

          <label className="business-inquiry-label" htmlFor="business-inquiry-addressDetail">
            상세 주소
          </label>
          <input
            id="business-inquiry-addressDetail"
            name="addressDetail"
            type="text"
            className="business-inquiry-input"
            placeholder="상세 주소를 입력해주세요."
            value={form.addressDetail}
            onChange={handleChange}
          />

          <button
            type="submit"
            className="business-inquiry-submit-btn"
            disabled={!isInquiryUserReady || isSubmitting}
          >
            {isSubmitting ? '상담 신청 등록 중...' : '상담 신청 등록'}
          </button>
        </form>

        {scriptError ? <p className="business-inquiry-status is-error">{scriptError}</p> : null}
        {submitError ? <p className="business-inquiry-status is-error">{submitError}</p> : null}
        {submitMessage ? <p className="business-inquiry-status is-success">{submitMessage}</p> : null}
      </section>
    </main>
  );
}

export default BusinessInquiryPage;
