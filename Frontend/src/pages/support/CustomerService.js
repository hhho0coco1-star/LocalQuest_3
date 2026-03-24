import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import '../../styles/CustomerService.css';

const faqData = [
  {
    id: 1,
    question: 'Local Quest는 어떤 서비스인가요?',
    answer:
      'Local Quest는 지역 기반 미션을 수행하고 보상을 받을 수 있는 플랫폼입니다. 사용자는 다양한 장소를 탐험하면서 새로운 경험을 할 수 있습니다.'
  },
  {
    id: 2,
    question: '회원가입은 어떻게 진행하나요?',
    answer:
      '회원가입 페이지에서 이메일과 비밀번호 등 기본 정보를 입력한 뒤 가입을 완료하면 바로 서비스를 이용할 수 있습니다.'
  },
  {
    id: 3,
    question: '미션 완료 여부는 어떻게 확인되나요?',
    answer:
      '미션별 인증 조건을 충족하면 시스템에서 완료 여부를 확인합니다. 일부 미션은 위치 정보나 사진 인증을 기반으로 검토될 수 있습니다.'
  },
  {
    id: 4,
    question: '문의 답변은 얼마나 걸리나요?',
    answer:
      '1:1 문의 접수 후 영업일 기준 순차적으로 확인하며, 일반적으로 1일에서 3일 이내 답변을 드리고 있습니다.'
  }
];

const noticeData = [
  {
    id: 1,
    title: '[중요] 4월 정기 점검 안내',
    author: '관리자',
    date: '2026-04-02',
    content:
      '보다 안정적인 서비스 제공을 위해 4월 정기 시스템 점검이 진행됩니다. 점검 시간 동안 일부 기능 이용이 제한될 수 있습니다.'
  },
  {
    id: 2,
    title: 'Local Quest 신규 미션 오픈 안내',
    author: '관리자',
    date: '2026-03-28',
    content:
      '이번 달부터 새로운 지역 탐험형 미션이 추가되었습니다. 앱 내 미션 목록에서 새롭게 추가된 콘텐츠를 확인해보세요.'
  },
  {
    id: 3,
    title: '이벤트 보상 지급 일정 안내',
    author: '관리자',
    date: '2026-03-20',
    content:
      '이벤트 참여 보상은 종료 후 영업일 기준 3일 이내 순차 지급됩니다. 지급 일정은 내부 사정에 따라 소폭 변동될 수 있습니다.'
  }
];

const mockLoginUser = {
  isLoggedIn: true,
  memberId: 'user001',
  memberName: '홍길동'
};

const CustomerService = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(location.state?.tab || 'notice');
  const [openNoticeId, setOpenNoticeId] = useState(null);
  const [openFaqId, setOpenFaqId] = useState(null);
  const [inquiryForm, setInquiryForm] = useState({
    title: '',
    content: ''
  });
  const [submittedInquiry, setSubmittedInquiry] = useState(null);

  useEffect(() => {
    if (location.state?.tab) {
      setActiveTab(location.state.tab);
    }
  }, [location.state]);

  const handleInquiryChange = (e) => {
    const { name, value } = e.target;
    setInquiryForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleInquirySubmit = (e) => {
    e.preventDefault();

    const trimmedTitle = inquiryForm.title.trim();
    const trimmedContent = inquiryForm.content.trim();

    if (!trimmedTitle || !trimmedContent) {
      window.alert('문의 제목과 내용을 모두 입력해주세요.');
      return;
    }

    const inquiryPayload = {
      memberId: mockLoginUser.memberId,
      memberName: mockLoginUser.memberName,
      title: trimmedTitle,
      content: trimmedContent,
      status: 'WAITING',
      createdAt: new Date().toISOString()
    };

    console.log('1:1 문의 등록 데이터', inquiryPayload);
    setSubmittedInquiry(inquiryPayload);
    setInquiryForm({
      title: '',
      content: ''
    });
  };

  return (
    <div className="cs-main-container">
      <div className="cs-header">
        <h1>고객센터</h1>
        <p>Local Quest 이용 중 궁금한 내용을 안내해드립니다.</p>
      </div>

      <div className="cs-tab-menu">
        <button
          className={activeTab === 'notice' ? 'active' : ''}
          onClick={() => setActiveTab('notice')}
        >
          공지사항
        </button>
        <button
          className={activeTab === 'faq' ? 'active' : ''}
          onClick={() => setActiveTab('faq')}
        >
          자주 묻는 질문
        </button>
        <button
          className={activeTab === 'contact' ? 'active' : ''}
          onClick={() => setActiveTab('contact')}
        >
          1:1 문의
        </button>
      </div>

      <div className="cs-content-body">
        {activeTab === 'notice' && (
          <div className="tab-panel">
            <h3>공지사항</h3>
            <p>관리자가 등록한 최신 공지사항을 확인해보세요.</p>
            <div className="notice-accordion">
              {noticeData.map((item) => (
                <div
                  key={item.id}
                  className={`notice-item ${openNoticeId === item.id ? 'open' : ''}`}
                >
                  <button
                    type="button"
                    className="notice-question"
                    onClick={() =>
                      setOpenNoticeId((prev) => (prev === item.id ? null : item.id))
                    }
                  >
                    <div className="notice-question-text">
                      <strong>{item.title}</strong>
                      <span>
                        {item.author} | {item.date}
                      </span>
                    </div>
                    <span className="notice-icon">
                      {openNoticeId === item.id ? '-' : '+'}
                    </span>
                  </button>
                  {openNoticeId === item.id && (
                    <div className="notice-answer">
                      <p>{item.content}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        {activeTab === 'faq' && (
          <div className="tab-panel">
            <h3>자주 묻는 질문</h3>
            <p>자주 문의되는 내용을 먼저 확인해보세요.</p>
            <div className="faq-accordion">
              {faqData.map((item) => (
                <div
                  key={item.id}
                  className={`faq-item ${openFaqId === item.id ? 'open' : ''}`}
                >
                  <button
                    type="button"
                    className="faq-question"
                    onClick={() =>
                      setOpenFaqId((prev) => (prev === item.id ? null : item.id))
                    }
                  >
                    <span>{item.question}</span>
                    <span className="faq-icon">{openFaqId === item.id ? '-' : '+'}</span>
                  </button>
                  {openFaqId === item.id && (
                    <div className="faq-answer">
                      <p>{item.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        {activeTab === 'contact' && (
          <div className="tab-panel">
            <h3>1:1 문의</h3>
            <p>문의 내용을 남겨주시면 관리자가 확인 후 답변할 수 있도록 전달됩니다.</p>

            {mockLoginUser.isLoggedIn ? (
              <div className="inquiry-section">
                <div className="inquiry-user-box">
                  <strong>{mockLoginUser.memberName}</strong>
                  <span>{mockLoginUser.memberId}</span>
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

                  <button type="submit" className="inquiry-submit-btn">
                    문의 등록
                  </button>
                </form>

                {submittedInquiry && (
                  <div className="inquiry-preview-box">
                    <h4>등록 예정 문의 데이터</h4>
                    <p><strong>작성자:</strong> {submittedInquiry.memberName} ({submittedInquiry.memberId})</p>
                    <p><strong>제목:</strong> {submittedInquiry.title}</p>
                    <p><strong>상태:</strong> {submittedInquiry.status}</p>
                    <p><strong>내용:</strong> {submittedInquiry.content}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="inquiry-login-guide">
                <p>1:1 문의는 로그인한 회원만 작성할 수 있습니다.</p>
                <button type="button" className="inquiry-login-btn">
                  로그인 하러 가기
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerService;
