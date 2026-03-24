import './App.css';
import { BrowserRouter as Router, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Login from './pages/auth/login/Login';
import SocialLoginCallback from './pages/auth/login/SocialLoginCallback';
import SignUp from './pages/auth/signup/SignUp';
import Terms from './pages/auth/signup/Terms';
import MainPage from './pages/main/MainPage';
import MyPage from './pages/mypage/MyPage';
import QuestList from './pages/quest/QuestList/QuestList';
import QuestDetail from './pages/quest/QuestDetail/QuestDetail';
import MyQuest from './pages/quest/MyQuest/MyQuest';
import MyQuestDetail from './pages/quest/MyQuest/MyQuestDetail';
import RewardPage from './pages/reward/rewardPage';
import Header from './components/common/Header';
import Footer from './components/common/Footer';

function AppRoutes({ isAuthenticated }) {
  const location = useLocation();
  const hideLayoutPaths = ['/login', '/login/social/callback', '/signup', '/terms'];
  const shouldHideLayout = hideLayoutPaths.includes(location.pathname);

  return (
    <>
      {!shouldHideLayout && <Header />}
      <Routes>
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/main" replace /> : <Login />}
        />
        <Route path="/login/social/callback" element={<SocialLoginCallback />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/terms" element={<Terms />} />
        <Route
          path="/main"
          element={<MainPage />}
        />
        <Route path="/explore" element={<QuestList />} />
        <Route path="/explore/:questId" element={<QuestDetail />} />
        <Route path="/quest" element={<MyQuest />} />
        <Route
          path="/mypage"
          element={isAuthenticated ? <MyPage /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/mypage/:userQuestId"
          element={isAuthenticated ? <MyQuestDetail /> : <Navigate to="/login" replace />}
        />
        <Route path="/reward" element={<RewardPage />} />
        <Route
          path="/"
          element={<Navigate to="/main" replace />}
        />
      </Routes>
      {!shouldHideLayout && <Footer />}
    </>
  );
}

function App() {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

  return (
    <Router>
      <AppRoutes isAuthenticated={isAuthenticated} />
    </Router>
  );
}

export default App;
