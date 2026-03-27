export const INITIAL_TERMS_CHECKS = {
    all: false,
    term1: false,
    term2: false,
    term3: false,
};

export function createAllCheckedTerms(isChecked) {
    return {
        all: isChecked,
        term1: isChecked,
        term2: isChecked,
        term3: isChecked,
    };
}

export function createSingleCheckedTerms(previousChecks, name, isChecked) {
    const nextChecks = { ...previousChecks, [name]: isChecked };
    const allChecked = nextChecks.term1 && nextChecks.term2 && nextChecks.term3;
    return { ...nextChecks, all: allChecked };
}

export function hasRequiredTermsAgreement(checks) {
    return Boolean(checks.term1 && checks.term2);
}
