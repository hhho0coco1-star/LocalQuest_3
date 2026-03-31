import Button from '../../common/Button';

function SocialLoginSection({ onSocialLogin }) {
    return (
        <div className="social-login">
            <p>소셜 로그인</p>
            <Button
                text="Google로 로그인"
                variant="google"
                onClick={() => onSocialLogin('google')}
            />
            <Button
                text="Naver로 로그인"
                variant="naver"
                onClick={() => onSocialLogin('naver')}
            />
            <Button
                text="Kakao로 로그인"
                variant="kakao"
                onClick={() => onSocialLogin('kakao')}
            />
        </div>
    );
}

export default SocialLoginSection;
