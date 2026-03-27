const USER_ID_REGEX = /^[A-Za-z0-9]{4,20}$/;
const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

export function isValidUserId(value) {
    return USER_ID_REGEX.test(String(value ?? '').trim());
}

export function isValidEmail(value) {
    return EMAIL_REGEX.test(String(value ?? '').trim());
}
