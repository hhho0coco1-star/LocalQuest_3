import { isValidEmail, isValidUserId } from '../../authValidation';

export function validateFindIdInput(name, email) {
    const trimmedName = String(name ?? '').trim();
    const trimmedEmail = String(email ?? '').trim();

    if (!trimmedName || !trimmedEmail) {
        return '이름과 이메일을 모두 입력해주세요.';
    }

    if (!isValidEmail(trimmedEmail)) {
        return '올바른 이메일 형식을 입력해주세요.';
    }

    return '';
}

export function validateFindPasswordInput(userId, email) {
    const trimmedUserId = String(userId ?? '').trim();
    const trimmedEmail = String(email ?? '').trim();

    if (!trimmedUserId || !trimmedEmail) {
        return '아이디와 이메일을 모두 입력해주세요.';
    }

    if (!isValidUserId(trimmedUserId)) {
        return '아이디는 4~20자 영문/숫자만 사용할 수 있습니다.';
    }

    if (!isValidEmail(trimmedEmail)) {
        return '올바른 이메일 형식을 입력해주세요.';
    }

    return '';
}

export function resolveLoginRedirectPath(search) {
    const redirectPath = new URLSearchParams(search).get('redirect');
    if (redirectPath && redirectPath.startsWith('/')) {
        return redirectPath;
    }
    return '/main';
}

export function toAuthPayload(loginResponseData) {
    return {
        accessToken: loginResponseData.accessToken,
        expiresIn: loginResponseData.expiresIn,
        user: {
            userId: loginResponseData.userId,
            userLoginId: loginResponseData.userLoginId,
            name: loginResponseData.name,
            nickname: loginResponseData.nickname,
            role: loginResponseData.role,
        },
    };
}
