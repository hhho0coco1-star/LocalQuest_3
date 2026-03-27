export function resolveApiErrorMessage(error, fallbackMessage) {
    const responseData = error?.response?.data;

    if (typeof responseData === 'string' && responseData.trim()) {
        return responseData;
    }

    if (typeof responseData?.message === 'string' && responseData.message.trim()) {
        return responseData.message;
    }

    if (typeof error?.message === 'string' && error.message.trim()) {
        return error.message;
    }

    return fallbackMessage;
}
