import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../../api/AxiosInstance';
import { inquiryApi } from '../../api/InquiryApi';
import '../../styles/CustomerService.css';

const TAB_BY_PATH = {
  '/support': 'notice',
  '/support/notice': 'notice',
  '/support/faq': 'faq',
  '/support/contact': 'contact',
};

const PATH_BY_TAB = {
  notice: '/support/notice',
  faq: '/support/faq',
  contact: '/support/contact',
};

const resolveTab = (location) => {
  if (location.state?.tab) {
    return location.state.tab;
  }

  return TAB_BY_PATH[location.pathname] || 'notice';
};

const formatSupportDate = (value) => {
  if (!value) {
    return '-';
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return String(value).slice(0, 10);
  }

  return parsedDate.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

function CustomerService() {
  const location = useLocation();
  const navigate = useNavigate();
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const authUser = useSelector((state) => state.auth.user);

  const isInquiryUserReady = isAuthenticated && Number(authUser?.userId) > 0;
  const inquiryMemberName = authUser?.name || authUser?.nickname || '회원';
  const inquiryMemberId =
    authUser?.userLoginId ||
    authUser?.email ||
    (authUser?.userId ? `USER-${authUser.userId}` : '-');

  const [activeTab, setActiveTab] = useState(resolveTab(location));
  const [openNoticeId, setOpenNoticeId] = useState(null);
  const [openFaqId, setOpenFaqId] = useState(null);
  const [noticeItems, setNoticeItems] = useState([]);
  const [faqItems, setFaqItems] = useState([]);
  const [isNoticeLoading, setIsNoticeLoading] = useState(true);
  const [isFaqLoading, setIsFaqLoading] = useState(true);
  const [noticeLoadError, setNoticeLoadError] = useState('');
  const [faqLoadError, setFaqLoadError] = useState('');
  const [inquiryForm, setInquiryForm] = useState({
    title: '',
    content: '',
  });
  const [isSubmittingInquiry, setIsSubmittingInquiry] = useState(false);
  const [inquirySubmitError, setInquirySubmitError] = useState('');
  const [inquirySubmitMessage, setInquirySubmitMessage] = useState('');

  useEffect(() => {
    setActiveTab(resolveTab(location));
  }, [location]);

  useEffect(() => {
    let isCancelled = false;

    const loadSupportData = async () => {
      setIsNoticeLoading(true);
      setIsFaqLoading(true);
      setNoticeLoadError('');
      setFaqLoadError('');

      try {
        const [noticeResponse, faqResponse] = await Promise.all([
          api.get('/api/notices'),
          api.get('/api/faqs'),
        ]);

        if (isCancelled) {
          return;
        }

        setNoticeItems(Array.isArray(noticeResponse.data) ? noticeResponse.data : []);
        setFaqItems(Array.isArray(faqResponse.data) ? faqResponse.data : []);
      } catch (error) {
        if (isCancelled) {
          return;
        }

        setNoticeLoadError('공지사항을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.');
        setFaqLoadError('FAQ를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.');
      } finally {
        if (!isCancelled) {
          setIsNoticeLoading(false);
          setIsFaqLoading(false);
        }
      }
    };

    loadSupportData();

    return () => {
      isCancelled = true;
    };
  }, []);

  const handleTabClick = (tab) => {
    const nextPath = PATH_BY_TAB[tab] || '/support';
    setActiveTab(tab);

    if (location.pathname !== nextPath) {
      navigate(nextPath, { state: { tab } });
    }
  };

  const handleInquiryChange = (event) => {
    const { name, value } = event.target;
    setInquiryForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleInquirySubmit = async (event) => {
    event.preventDefault();

    if (isSubmittingInquiry) {
      return;
    }

    if (!isInquiryUserReady) {
      navigate(`/login?redirect=${encodeURIComponent('/support/contact')}`);
      return;
    }

    const trimmedTitle = inquiryForm.title.trim();
    const trimmedContent = inquiryForm.content.trim();

    if (!trimmedTitle || !trimmedContent) {
      window.alert('문의 제목과 내용을 모두 입력해주세요.');
      return;
    }

    setInquirySubmitError('');
    setInquirySubmitMessage('');

    try {
      setIsSubmittingInquiry(true);
      await inquiryApi.createInquiry({
        title: trimmedTitle,
        content: trimmedContent,
      });
      setInquiryForm({
        title: '',
        content: '',
      });
      setInquirySubmitMessage('문의가 등록되었습니다. 마이페이지에서 답변 상태를 확인할 수 있습니다.');
    } catch (error) {
      const message =
        error.response?.data?.message ||
        '문의 등록에 실패했습니다. 잠시 후 다시 시도해주세요.';
      setInquirySubmitError(message);
    } finally {
      setIsSubmittingInquiry(false);
    }
  };

  return (
    <div className="cs-main-container">
      <div className="cs-header">
        <h1>고객센터</h1>
        <p>Local Quest 이용 중 궁금한 점과 안내를 확인해보세요.</p>
      </div>

      <div className="cs-tab-menu">
        <button
          type="button"
          className={activeTab === 'notice' ? 'active' : ''}
          onClick={() => handleTabClick('notice')}
        >
          공지사항
        </button>
        <button
          type="button"
          className={activeTab === 'faq' ? 'active' : ''}
          onClick={() => handleTabClick('faq')}
        >
          자주 묻는 질문
        </button>
        <button
          type="button"
          className={activeTab === 'contact' ? 'active' : ''}
          onClick={() => handleTabClick('contact')}
        >
          1:1 문의
        </button>
      </div>

      <div className="cs-content-body">
        {activeTab === 'notice' ? (
          <div className="tab-panel">
            <h3>공지사항</h3>
            <div className="notice-accordion">
              {isNoticeLoading ? <p>공지사항을 불러오는 중입니다.</p> : null}
              {!isNoticeLoading && noticeLoadError ? <p>{noticeLoadError}</p> : null}
              {!isNoticeLoading && !noticeLoadError && !noticeItems.length ? (
                <p>등록된 공지사항이 없습니다.</p>
              ) : null}
              {!isNoticeLoading && !noticeLoadError
                ? noticeItems.map((item) => (
                    <div
                      key={item.noticeId}
                      className={`notice-item ${openNoticeId === item.noticeId ? 'open' : ''}`}
                    >
                      <button
                        type="button"
                        className="notice-question"
                        onClick={() =>
                          setOpenNoticeId((prev) => (prev === item.noticeId ? null : item.noticeId))
                        }
                      >
                        <div className="notice-question-text">
                          <strong>{item.title}</strong>
                          <span>{`관리자 | ${formatSupportDate(item.createdAt)}`}</span>
                        </div>
                        <span className="notice-icon">
                          {openNoticeId === item.noticeId ? '-' : '+'}
                        </span>
                      </button>
                      {openNoticeId === item.noticeId ? (
                        <div className="notice-answer">
                          <p>{item.content}</p>
                        </div>
                      ) : null}
                    </div>
                  ))
                : null}
            </div>
          </div>
        ) : null}

        {activeTab === 'faq' ? (
          <div className="tab-panel">
            <h3>자주 묻는 질문</h3>
            <div className="faq-accordion">
              {isFaqLoading ? <p>FAQ를 불러오는 중입니다.</p> : null}
              {!isFaqLoading && faqLoadError ? <p>{faqLoadError}</p> : null}
              {!isFaqLoading && !faqLoadError && !faqItems.length ? (
                <p>등록된 FAQ가 없습니다.</p>
              ) : null}
              {!isFaqLoading && !faqLoadError
                ? faqItems.map((item) => (
                    <div
                      key={item.faqId}
                      className={`faq-item ${openFaqId === item.faqId ? 'open' : ''}`}
                    >
                      <button
                        type="button"
                        className="faq-question"
                        onClick={() => setOpenFaqId((prev) => (prev === item.faqId ? null : item.faqId))}
                      >
                        <span>{item.question}</span>
                        <span className="faq-icon">{openFaqId === item.faqId ? '-' : '+'}</span>
                      </button>
                      {openFaqId === item.faqId ? (
                        <div className="faq-answer">
                          <p>{item.answer}</p>
                        </div>
                      ) : null}
                    </div>
                  ))
                : null}
            </div>
          </div>
        ) : null}

        {activeTab === 'contact' ? (
          <div className="tab-panel">
            <h3>1:1 문의</h3>
            <p>문의 내용을 남겨주시면 관리자가 확인 후 답변드릴 수 있도록 전달됩니다.</p>

            {isInquiryUserReady ? (
              <div className="inquiry-section">
                <div className="inquiry-user-box">
                  <strong>{inquiryMemberName}</strong>
                  <span>{inquiryMemberId}</span>
                </div>

                <form className="inquiry-form" onSubmit={handleInquirySubmit}>
                  <label className="inquiry-label" htmlFor="inquiry-title">
                    문의 제목
                  </label>
                  <input
                    id="inquiry-title"
                    name="title"
                    type="text"
                    className="inquiry-input"
                    placeholder="문의 제목을 입력해주세요."
                    value={inquiryForm.title}
                    onChange={handleInquiryChange}
                  />

                  <label className="inquiry-label" htmlFor="inquiry-content">
                    문의 내용
                  </label>
                  <textarea
                    id="inquiry-content"
                    name="content"
                    className="inquiry-textarea"
                    placeholder="문의하실 내용을 자세히 작성해주세요."
                    value={inquiryForm.content}
                    onChange={handleInquiryChange}
                  />

                  <button type="submit" className="inquiry-submit-btn" disabled={isSubmittingInquiry}>
                    {isSubmittingInquiry ? '등록 중...' : '문의 등록'}
                  </button>
                </form>
                {inquirySubmitError ? (
                  <p className="inquiry-status-message is-error">{inquirySubmitError}</p>
                ) : null}
                {inquirySubmitMessage ? (
                  <p className="inquiry-status-message is-success">{inquirySubmitMessage}</p>
                ) : null}
              </div>
            ) : (
              <div className="inquiry-login-guide">
                <p>1:1 문의는 로그인한 회원만 작성할 수 있습니다.</p>
                <button
                  type="button"
                  className="inquiry-login-btn"
                  onClick={() => navigate(`/login?redirect=${encodeURIComponent('/support/contact')}`)}
                >
                  로그인하러 가기
                </button>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default CustomerService;
