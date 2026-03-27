import { isValidEmail, isValidUserId } from '../../authValidation';

const NICKNAME_REGEX = /^[A-Za-z0-9\uAC00-\uD7A3_]{2,20}$/;
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d\s])(?=\S+$).{8,20}$/;
const NAME_REGEX = /^[A-Za-z\uAC00-\uD7A3\s]{1,30}$/;
const NAME_JAMO_REGEX = /[\u1100-\u11FF\u3130-\u318F]/;

export const INITIAL_SIGNUP_FORM_DATA = {
    userId: '',
    password: '',
    confirmPassword: '',
    nickname: '',
    email: '',
    name: '',
    birthYear: '',
    birthMonth: '',
    birthDay: '',
    gender: '',
};

export const INITIAL_FIELD_CHECKS = {
    userId: { status: 'idle', message: '' },
    nickname: { status: 'idle', message: '' },
    email: { status: 'idle', message: '' },
};

export const MONTH_OPTIONS = Array.from({ length: 12 }, (_, index) => index + 1);
export const DAY_OPTIONS = Array.from({ length: 31 }, (_, index) => index + 1);

export function createYearOptions(count = 100) {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: count }, (_, index) => currentYear - index);
}

export function getBirthDate(year, month, day) {
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
}

export function validateUserId(value) {
    if (!value) {
        return '아이디를 입력해주세요.';
    }
    if (!isValidUserId(value)) {
        return '아이디는 4~20자 영문/숫자만 사용할 수 있습니다.';
    }
    return '';
}

export function validateName(value) {
    if (!value) {
        return '이름을 입력해주세요.';
    }
    if (NAME_JAMO_REGEX.test(value)) {
        return '이름은 자음/모음만 입력할 수 없고, 완성형 한글 또는 영문만 가능합니다.';
    }
    if (!NAME_REGEX.test(value)) {
        return '이름은 한글(완성형)과 영문만 입력할 수 있습니다.';
    }
    return '';
}

export function validateNickname(value) {
    if (!value) {
        return '닉네임을 입력해주세요.';
    }
    if (!NICKNAME_REGEX.test(value)) {
        return '닉네임은 2~20자 한글/영문/숫자/밑줄(_)만 사용할 수 있습니다.';
    }
    return '';
}

export function validateEmail(value) {
    if (!value) {
        return '이메일을 입력해주세요.';
    }
    if (!isValidEmail(value)) {
        return '올바른 이메일 형식이 아닙니다.';
    }
    return '';
}

export function validateUniqueFieldValue(fieldName, value) {
    if (fieldName === 'userId') {
        return validateUserId(value);
    }

    if (fieldName === 'nickname') {
        return validateNickname(value);
    }

    if (fieldName === 'email') {
        return validateEmail(value);
    }

    return '';
}

export function validateSignUpForm(formData, fieldChecks) {
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
    } else if (!PASSWORD_REGEX.test(formData.password)) {
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

    return {
        errors: nextErrors,
        normalizedFields: {
            userId: trimmedUserId,
            nickname: trimmedNickname,
            email: trimmedEmail,
            name: trimmedName,
        },
    };
}
