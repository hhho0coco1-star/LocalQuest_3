import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import LocalQuestLogo from './LocalQuestLogo';
import { TERMS } from '../../data/termsData';
import './Footer.css';

const Footer = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalBody, setModalBody] = useState('');

  // --- [1. 페이지 경로 설정] ---
  const paths = {
    explore: "/explore",
    ranking: "/ranking",
    badges: "/badges",
    partner: "/business/partner",
    guide: "/business/guide",
    alliance: "/business/alliance",
    faq: "/support/faq",
    notice: "/support/notice",
    contact: "/support/contact",
    support: "/support"
  };

  const openModal = (title, body) => {
    setModalTitle(title);
    setModalBody(body);
    setIsModalOpen(true);
  };

  return (
    <div>
      <footer className="footer-main-container">
        <div className="footer-inner-content">
          <div className="footer-brand-section">
            <div className="footer-logo-box">
              <LocalQuestLogo className="footer-localquest-logo" />
            </div>
            <p className="footer-brand-desc">
              지역을 게임처럼 탐험하는<br />
              미션 기반 O2O 로컬 발견 플랫폼
            </p>
          </div>

          <div className="footer-menu-wrapper">
            <div className="footer-menu-col">
              <h4 className="footer-menu-title">서비스</h4>
              <ul className="footer-menu-list">
                <li><Link to={paths.explore} className="footer-link">탐색하기</Link></li>
                <li><Link to={paths.ranking} className="footer-link">랭킹</Link></li>
                <li><Link to={paths.badges} className="footer-link">배지 도감</Link></li>
              </ul>
            </div>
            <div className="footer-menu-col">
              <h4 className="footer-menu-title">비즈니스</h4>
              <ul className="footer-menu-list">
                <li><Link to={paths.partner} className="footer-link">파트너 센터</Link></li>
                <li><Link to={paths.guide} className="footer-link">입점 안내</Link></li>
                <li><Link to={paths.alliance} className="footer-link">제휴 제안</Link></li>
              </ul>
            </div>
            <div className="footer-menu-col">
              <h4 className="footer-menu-title">고객지원</h4>
              <ul className="footer-menu-list">
                {/* state를 통해 어떤 탭을 열지 전달합니다 */}
                <li><Link to={paths.support} state={{ tab: 'notice' }} className="footer-link">공지사항</Link></li>
                <li><Link to={paths.support} state={{ tab: 'faq' }} className="footer-link">자주 묻는 질문</Link></li>
                <li><Link to={paths.support} state={{ tab: 'contact' }} className="footer-link">1:1 문의</Link></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="footer-bottom-bar">
          <p className="footer-copyright">© 2026 Local Quest. All Rights Reserved.</p>
          <div className="footer-legal-links">
            <span className="footer-legal-item" onClick={() => openModal('이용약관', TERMS.SERVICE)}>이용약관</span>
            <span className="footer-legal-item footer-bold" onClick={() => openModal('개인정보처리방침', TERMS.PRIVACY)}>개인정보처리방침</span>
          </div>
        </div>
      </footer>

      {/* [모달 영역] */}
      {isModalOpen && (
        <div className="modal-fixed-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-fixed-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-fixed-header">
              <h3>{modalTitle}</h3>
              <button onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>
            <div className="modal-fixed-body">
              {modalBody}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Footer;
