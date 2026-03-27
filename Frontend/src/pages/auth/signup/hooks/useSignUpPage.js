import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { userApi } from '../../../../api/UserApi';
import { resolveApiErrorMessage } from '../../../../utils/errorMessage';
import {
    createYearOptions,
    DAY_OPTIONS,
    INITIAL_FIELD_CHECKS,
    INITIAL_SIGNUP_FORM_DATA,
    MONTH_OPTIONS,
    validateSignUpForm,
    validateUniqueFieldValue,
} from '../utils/signupUtils';

function getUniqueFieldCheckApi(fieldName, value) {
    if (fieldName === 'userId') {
        return userApi.checkId(value);
    }

    if (fieldName === 'nickname') {
        return userApi.checkNickname(value);
    }

    return userApi.checkEmail(value);
}

export function useSignUpPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const marketingAgreeFromTerms = location.state?.marketingAgree === true;

    const [formData, setFormData] = useState(INITIAL_SIGNUP_FORM_DATA);
    const [errors, setErrors] = useState({});
    const [fieldChecks, setFieldChecks] = useState(INITIAL_FIELD_CHECKS);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const years = useMemo(() => createYearOptions(), []);
    const months = MONTH_OPTIONS;
    const days = DAY_OPTIONS;

    const updateFieldCheck = (fieldName, status, message = '') => {
        setFieldChecks((prev) => ({
            ...prev,
            [fieldName]: { status, message },
        }));
    };

    const handleChange = (event) => {
        const { name, value } = event.target;
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
        const localError = validateUniqueFieldValue(fieldName, value);

        if (localError) {
            setErrors((prev) => ({ ...prev, [fieldName]: localError }));
            updateFieldCheck(fieldName, 'idle');
            return;
        }

        setErrors((prev) => ({ ...prev, [fieldName]: '' }));
        updateFieldCheck(fieldName, 'checking', '중복 확인 중입니다...');

        try {
            const response = await getUniqueFieldCheckApi(fieldName, value);
            const isAvailable = response.data?.available === true;

            if (isAvailable) {
                updateFieldCheck(fieldName, 'available', '사용 가능한 값입니다.');
            } else {
                updateFieldCheck(fieldName, 'unavailable', '이미 사용 중인 값입니다.');
            }
        } catch (error) {
            const responseData = error?.response?.data;
            const serverMessage =
                (typeof responseData === 'string' && responseData) ||
                responseData?.message ||
                '';

            if (serverMessage) {
                setErrors((prev) => ({ ...prev, [fieldName]: serverMessage }));
                updateFieldCheck(fieldName, 'idle');
                return;
            }

            updateFieldCheck(fieldName, 'error', '중복 확인 중 오류가 발생했습니다.');
        }
    };

    const handleSignup = async (event) => {
        event.preventDefault();
        if (isSubmitting) {
            return;
        }

        const { errors: nextErrors, normalizedFields } = validateSignUpForm(formData, fieldChecks);

        if (Object.keys(nextErrors).length > 0) {
            setErrors(nextErrors);
            return;
        }

        try {
            setIsSubmitting(true);
            await userApi.signUp({
                ...formData,
                ...normalizedFields,
                marketingAgree: marketingAgreeFromTerms,
            });
            alert('성공!');
            navigate('/login');
        } catch (error) {
            const message = resolveApiErrorMessage(error, '회원가입 처리 중 오류가 발생했습니다.');
            alert(`실패: ${message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        navigate(-1);
    };

    return {
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
    };
}
