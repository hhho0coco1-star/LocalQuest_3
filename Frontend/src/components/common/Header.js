import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { clearAuth } from '../../store/authSlice';
import { userApi } from '../../api/UserApi';
import { buildBackendUrl } from '../../config/runtimeUrls';
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

  return (
    <div>
      <header className="header-main-container">
        {/* 상단 섹션: 로고 & 유틸 버튼 */}
        <div className="header-top-section">
          <div className="header-inner"> {/* 중앙 정렬을 위한 이너 박스 추가 */}
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
                  <button className="header-auth-btn" onClick={handleLogout}>로그아웃</button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 하단 섹션: 네비게이션 바 */}
        <nav className="header-nav-bar">
          <div className="header-inner"> {/* 중앙 정렬을 위한 이너 박스 추가 */}
            <ul className="header-nav-list">
              <li className="header-nav-item">
                <Link to="/explore" className="header-nav-link">퀘스트 목록</Link>
              </li>
              <li className="header-nav-item">
                <Link to="/quest" className="header-nav-link">내 퀘스트</Link>
              </li>
              <li className="header-nav-item">
                <Link to="/reward" className="header-nav-link">성장 및 보상</Link>
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
      <div className="header-relative-space"> </div>

    </div>
  );
};

export default Header;
