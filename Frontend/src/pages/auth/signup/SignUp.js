import Input from '../../../components/common/Input';
import Button from '../../../components/common/Button';
import BirthDateSelect from './components/BirthDateSelect';
import GenderSelect from './components/GenderSelect';
import UniqueCheckField from './components/UniqueCheckField';
import { useSignUpPage } from './hooks/useSignUpPage';
import './SignUp.css';

function Signup() {
    const {
        formData,
        errors,
        fieldChecks,
        isSubmitting,
        years,
        months,
        days,
        handleChange,
        handleGenderSelect,
        handleUniqueFieldBlur,
        handleSignup,
        handleCancel,
    } = useSignUpPage();

    return (
        <div className="signup-container">
            <h2 className="signup-title">회원정보 입력</h2>

            <form className="signup-form" onSubmit={handleSignup}>
                <div className="form-section">
                    <h3 className="section-title">계정 정보</h3>
                    <UniqueCheckField
                        label="아이디"
                        name="userId"
                        placeholder="아이디 입력"
                        value={formData.userId}
                        onChange={handleChange}
                        onBlur={() => handleUniqueFieldBlur('userId')}
                        error={errors.userId}
                        checkMessage={fieldChecks.userId.message}
                        checkStatus={fieldChecks.userId.status}
                    />
                    <Input
                        label="비밀번호"
                        type="password"
                        name="password"
                        placeholder="비밀번호 입력"
                        value={formData.password}
                        onChange={handleChange}
                        error={errors.password}
                    />
                    <Input
                        label="비밀번호 확인"
                        type="password"
                        name="confirmPassword"
                        placeholder="비밀번호 재입력"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        error={errors.confirmPassword}
                    />
                    <UniqueCheckField
                        label="닉네임"
                        name="nickname"
                        placeholder="사용할 닉네임"
                        value={formData.nickname}
                        onChange={handleChange}
                        onBlur={() => handleUniqueFieldBlur('nickname')}
                        error={errors.nickname}
                        checkMessage={fieldChecks.nickname.message}
                        checkStatus={fieldChecks.nickname.status}
                    />
                </div>

                <div className="section-divider"></div>

                <div className="form-section">
                    <h3 className="section-title">개인 정보</h3>
                    <Input
                        label="이름"
                        name="name"
                        placeholder="이름 입력"
                        value={formData.name}
                        onChange={handleChange}
                        error={errors.name}
                    />
                    <UniqueCheckField
                        label="이메일"
                        name="email"
                        type="email"
                        placeholder="example@email.com"
                        value={formData.email}
                        onChange={handleChange}
                        onBlur={() => handleUniqueFieldBlur('email')}
                        error={errors.email}
                        checkMessage={fieldChecks.email.message}
                        checkStatus={fieldChecks.email.status}
                    />

                    <BirthDateSelect
                        birthYear={formData.birthYear}
                        birthMonth={formData.birthMonth}
                        birthDay={formData.birthDay}
                        years={years}
                        months={months}
                        days={days}
                        onChange={handleChange}
                        errorMessage={errors.birthDate}
                    />

                    <GenderSelect
                        value={formData.gender}
                        onSelect={handleGenderSelect}
                        errorMessage={errors.gender}
                    />
                </div>

                <div className="signup-buttons">
                    <Button text={isSubmitting ? '가입 중..' : '가입하기'} type="submit" variant="primary" disabled={isSubmitting} />
                    <Button text="취소" variant="outline" onClick={handleCancel} disabled={isSubmitting} />
                </div>
            </form>
        </div>
    );
}

export default Signup;
