import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { setAuth } from '../../../store/authSlice';
import './Login.css';

function SocialLoginCallback() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const hashText = location.hash.startsWith('#')
            ? location.hash.substring(1)
            : location.hash;
        const hashParams = new URLSearchParams(hashText);
        const errorMessage = searchParams.get('error');

        if (errorMessage) {
            alert(errorMessage);
            navigate('/login', { replace: true });
            return;
        }

        const accessToken = hashParams.get('accessToken') || searchParams.get('accessToken');
        const expiresIn = Number(hashParams.get('expiresIn') || searchParams.get('expiresIn') || 0);
        const userId = Number(hashParams.get('userId') || searchParams.get('userId') || 0);
        const userLoginId = hashParams.get('userLoginId') || searchParams.get('userLoginId');
        const name = hashParams.get('name') || searchParams.get('name');
        const nickname = hashParams.get('nickname') || searchParams.get('nickname');
        const role = hashParams.get('role') || searchParams.get('role');

        if (!accessToken || !userId || !userLoginId) {
            alert('소셜 로그인 처리에 실패했습니다. 다시 시도해주세요.');
            navigate('/login', { replace: true });
            return;
        }

        dispatch(setAuth({
            accessToken,
            expiresIn,
            user: {
                userId,
                userLoginId,
                name,
                nickname,
                role
            }
        }));

        navigate('/main', { replace: true });
    }, [dispatch, location.hash, location.search, navigate]);

    return (
        <div className="login-container">
            <p>소셜 로그인 처리 중입니다...</p>
        </div>
    );
}

export default SocialLoginCallback;
