import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Input from '../../../components/common/Input';
import Button from '../../../components/common/Button';
import { userApi } from '../../../api/UserApi';
import './SignUp.css';

function Signup() {
    const navigate = useNavigate();
    const userIdRegex = /^[A-Za-z0-9]{4,20}$/;
    const nicknameRegex = /^[A-Za-z0-9\uAC00-\uD7A3_]{2,20}$/;
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d\s])(?=\S+$).{8,20}$/;
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    const nameRegex = /^[A-Za-z\uAC00-\uD7A3\s]{1,30}$/;
    const nameJamoRegex = /[\u1100-\u11FF\u3130-\u318F]/;

    const [formData, setFormData] = useState({
        userId: '',
        password: '',
        confirmPassword: '',
        nickname: '',
        email: '',
        name: '',
        birthYear: '',
        birthMonth: '',
        birthDay: '',
        gender: ''
    });

    const years = Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i);
    const months = Array.from({ length: 12 }, (_, i) => i + 1);
    const days = Array.from({ length: 31 }, (_, i) => i + 1);

    const [errors, setErrors] = useState({});
    const [fieldChecks, setFieldChecks] = useState({
        userId: { status: 'idle', message: '' },
        nickname: { status: 'idle', message: '' },
        email: { status: 'idle', message: '' }
    });

    const updateFieldCheck = (fieldName, status, message = '') => {
        setFieldChecks((prev) => ({
            ...prev,
            [fieldName]: { status, message }
        }));
    };

    const getBirthDate = (year, month, day) => {
        const y = Number(year);
        const m = Number(month);
        const d = Number(day);

        if (!Number.isInteger(y) || !Number.isInteger(m) || !Number.isInteger(d)) {
            return null;
        }

        const birthDate = new Date(y, m - 1, d);
        if (
            birthDate.getFullYear() !== y ||
            birthDate.getMonth() !== m - 1 ||
            birthDate.getDate() !== d
        ) {
            return null;
        }

        birthDate.setHours(0, 0, 0, 0);
        return birthDate;
    };

    const validateUserId = (value) => {
        if (!value) return '아이디를 입력해주세요.';
        if (!userIdRegex.test(value)) {
            return '아이디는 4~20자 영문/숫자만 사용할 수 있습니다.';
        }
        return '';
    };

    const validateName = (value) => {
        if (!value) return '이름을 입력해주세요.';
        if (nameJamoRegex.test(value)) {
            return '이름은 자음/모음만 입력할 수 없고, 완성형 한글 또는 영문만 가능합니다.';
        }
        if (!nameRegex.test(value)) {
            return '이름은 한글(완성형)과 영문만 입력할 수 있습니다.';
        }
        return '';
    };

    const validateNickname = (value) => {
        if (!value) return '닉네임을 입력해주세요.';
        if (!nicknameRegex.test(value)) {
            return '닉네임은 2~20자 한글/영문/숫자/밑줄(_)만 사용할 수 있습니다.';
        }
        return '';
    };

    const validateEmail = (value) => {
        if (!value) return '이메일을 입력해주세요.';
        if (!emailRegex.test(value)) return '올바른 이메일 형식이 아닙니다.';
        return '';
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));

        if (name === 'password' || name === 'confirmPassword') {
            setErrors((prev) => ({ ...prev, password: '', confirmPassword: '' }));
        }

        if (name === 'userId') {
            setErrors((prev) => ({ ...prev, userId: '' }));
            updateFieldCheck('userId', 'idle');
        }

        if (name === 'nickname') {
            setErrors((prev) => ({ ...prev, nickname: '' }));
            updateFieldCheck('nickname', 'idle');
        }

        if (name === 'email') {
            setErrors((prev) => ({ ...prev, email: '' }));
            updateFieldCheck('email', 'idle');
        }

        if (name === 'name') {
            setErrors((prev) => ({ ...prev, name: '' }));
        }

        if (name === 'birthYear' || name === 'birthMonth' || name === 'birthDay') {
            setErrors((prev) => ({ ...prev, birthDate: '' }));
        }
    };

    const handleGenderSelect = (gender) => {
        setFormData((prev) => ({ ...prev, gender }));
        setErrors((prev) => ({ ...prev, gender: '' }));
    };

    const handleUniqueFieldBlur = async (fieldName) => {
        const value = formData[fieldName].trim();
        let localError = '';

        if (fieldName === 'userId') localError = validateUserId(value);
        if (fieldName === 'nickname') localError = validateNickname(value);
        if (fieldName === 'email') localError = validateEmail(value);

        if (localError) {
            setErrors((prev) => ({ ...prev, [fieldName]: localError }));
            updateFieldCheck(fieldName, 'idle');
            return;
        }

        setErrors((prev) => ({ ...prev, [fieldName]: '' }));
        updateFieldCheck(fieldName, 'checking', '중복 확인 중입니다...');

        try {
            let response;

            if (fieldName === 'userId') {
                response = await userApi.checkId(value);
            } else if (fieldName === 'nickname') {
                response = await userApi.checkNickname(value);
            } else {
                response = await userApi.checkEmail(value);
            }

            const isAvailable = response.data?.available === true;
            if (isAvailable) {
                updateFieldCheck(fieldName, 'available', '사용 가능한 값입니다.');
            } else {
                updateFieldCheck(fieldName, 'unavailable', '이미 사용 중인 값입니다.');
            }
        } catch (error) {
            const serverMessage =
                (typeof error.response?.data === 'string' && error.response.data) ||
                error.response?.data?.message ||
                '';

            if (serverMessage) {
                setErrors((prev) => ({ ...prev, [fieldName]: serverMessage }));
                updateFieldCheck(fieldName, 'idle');
                return;
            }

            updateFieldCheck(fieldName, 'error', '중복 확인 중 오류가 발생했습니다.');
        }
    };

    const handleSignup = async (e) => {
        e.preventDefault();

        const trimmedUserId = formData.userId.trim();
        const trimmedNickname = formData.nickname.trim();
        const trimmedEmail = formData.email.trim();
        const trimmedName = formData.name.trim();
        const nextErrors = {};

        const userIdError = validateUserId(trimmedUserId);
        if (userIdError) {
            nextErrors.userId = userIdError;
        } else if (fieldChecks.userId.status !== 'available') {
            nextErrors.userId = '아이디 입력 후 포커스를 이동해 중복 확인을 완료해주세요.';
        }

        const nicknameError = validateNickname(trimmedNickname);
        if (nicknameError) {
            nextErrors.nickname = nicknameError;
        } else if (fieldChecks.nickname.status !== 'available') {
            nextErrors.nickname = '닉네임 입력 후 포커스를 이동해 중복 확인을 완료해주세요.';
        }

        if (!formData.password) {
            nextErrors.password = '비밀번호를 입력해주세요.';
        } else if (!passwordRegex.test(formData.password)) {
            nextErrors.password = '비밀번호는 8~20자 영문/숫자/특수문자를 포함해야 합니다.';
        }

        if (formData.password !== formData.confirmPassword) {
            nextErrors.confirmPassword = '비밀번호가 일치하지 않습니다.';
        }

        const emailError = validateEmail(trimmedEmail);
        if (emailError) {
            nextErrors.email = emailError;
        } else if (fieldChecks.email.status !== 'available') {
            nextErrors.email = '이메일 입력 후 포커스를 이동해 중복 확인을 완료해주세요.';
        }

        const nameError = validateName(trimmedName);
        if (nameError) {
            nextErrors.name = nameError;
        }

        if (!formData.birthYear || !formData.birthMonth || !formData.birthDay) {
            nextErrors.birthDate = '생년월일을 모두 선택해주세요.';
        } else {
            const birthDate = getBirthDate(formData.birthYear, formData.birthMonth, formData.birthDay);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (!birthDate) {
                nextErrors.birthDate = '올바른 생년월일이 아닙니다.';
            } else if (birthDate > today) {
                nextErrors.birthDate = '생년월일은 오늘 이전이어야 합니다.';
            }
        }

        if (!['M', 'F'].includes(formData.gender)) {
            nextErrors.gender = '성별을 선택해주세요.';
        }

        if (Object.keys(nextErrors).length > 0) {
            setErrors(nextErrors);
            return;
        }

        try {
            await userApi.signUp({
                ...formData,
                userId: trimmedUserId,
                nickname: trimmedNickname,
                email: trimmedEmail,
                name: trimmedName
            });
            alert('성공!');
            navigate('/login');
        } catch (error) {
            alert('실패: ' + error.response?.data);
        }
    };

    return (
        <div className="signup-container">
            <h2 className="signup-title">회원정보 입력</h2>

            <form className="signup-form" onSubmit={handleSignup}>
                <div className="form-section">
                    <h3 className="section-title">계정 정보</h3>
                    <div className="signup-field-group">
                        <Input
                            label="아이디"
                            name="userId"
                            placeholder="아이디 입력"
                            value={formData.userId}
                            onChange={handleChange}
                            onBlur={() => handleUniqueFieldBlur('userId')}
                            error={errors.userId}
                        />
                        {fieldChecks.userId.message && !errors.userId && (
                            <p className={`field-check-message ${fieldChecks.userId.status}`}>
                                {fieldChecks.userId.message}
                            </p>
                        )}
                    </div>
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
                    <div className="signup-field-group">
                        <Input
                            label="닉네임"
                            name="nickname"
                            placeholder="사용할 닉네임"
                            value={formData.nickname}
                            onChange={handleChange}
                            onBlur={() => handleUniqueFieldBlur('nickname')}
                            error={errors.nickname}
                        />
                        {fieldChecks.nickname.message && !errors.nickname && (
                            <p className={`field-check-message ${fieldChecks.nickname.status}`}>
                                {fieldChecks.nickname.message}
                            </p>
                        )}
                    </div>
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
                    <div className="signup-field-group">
                        <Input
                            label="이메일"
                            type="email"
                            name="email"
                            placeholder="example@email.com"
                            value={formData.email}
                            onChange={handleChange}
                            onBlur={() => handleUniqueFieldBlur('email')}
                            error={errors.email}
                        />
                        {fieldChecks.email.message && !errors.email && (
                            <p className={`field-check-message ${fieldChecks.email.status}`}>
                                {fieldChecks.email.message}
                            </p>
                        )}
                    </div>

                    <div className="signup-field-group">
                        <label className="lq-label">생년월일</label>
                        <div className="birth-dropdowns">
                            <select
                                name="birthYear"
                                value={formData.birthYear}
                                onChange={handleChange}
                                className={`lq-select ${errors.birthDate ? 'is-error' : ''}`}
                            >
                                <option value="">년</option>
                                {years.map((y) => <option key={y} value={y}>{y}</option>)}
                            </select>
                            <select
                                name="birthMonth"
                                value={formData.birthMonth}
                                onChange={handleChange}
                                className={`lq-select ${errors.birthDate ? 'is-error' : ''}`}
                            >
                                <option value="">월</option>
                                {months.map((m) => <option key={m} value={m}>{m}</option>)}
                            </select>
                            <select
                                name="birthDay"
                                value={formData.birthDay}
                                onChange={handleChange}
                                className={`lq-select ${errors.birthDate ? 'is-error' : ''}`}
                            >
                                <option value="">일</option>
                                {days.map((d) => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>
                        {errors.birthDate && <span className="lq-error-msg">{errors.birthDate}</span>}
                    </div>

                    <div className="signup-field-group">
                        <label className="lq-label">성별</label>
                        <div className="gender-box-group">
                            <button
                                type="button"
                                className={`gender-box ${formData.gender === 'M' ? 'active' : ''} ${errors.gender ? 'is-error' : ''}`}
                                onClick={() => handleGenderSelect('M')}
                            >
                                남성
                            </button>
                            <button
                                type="button"
                                className={`gender-box ${formData.gender === 'F' ? 'active' : ''} ${errors.gender ? 'is-error' : ''}`}
                                onClick={() => handleGenderSelect('F')}
                            >
                                여성
                            </button>
                        </div>
                        {errors.gender && <span className="lq-error-msg">{errors.gender}</span>}
                    </div>
                </div>

                <div className="signup-buttons">
                    <Button text="가입하기" type="submit" variant="primary" />
                    <Button text="취소" variant="outline" onClick={() => navigate(-1)} />
                </div>
            </form>
        </div>
    );
}

export default Signup;
