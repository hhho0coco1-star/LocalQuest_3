import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    createAllCheckedTerms,
    createSingleCheckedTerms,
    hasRequiredTermsAgreement,
    INITIAL_TERMS_CHECKS,
} from '../utils/termsUtils';

export function useTermsPage() {
    const navigate = useNavigate();
    const [checks, setChecks] = useState(INITIAL_TERMS_CHECKS);

    const handleAllCheck = (event) => {
        const isChecked = event.target.checked;
        setChecks(createAllCheckedTerms(isChecked));
    };

    const handleSingleCheck = (name, isChecked) => {
        setChecks((prev) => createSingleCheckedTerms(prev, name, isChecked));
    };

    const handlePrev = () => {
        navigate(-1);
    };

    const handleNext = () => {
        if (hasRequiredTermsAgreement(checks)) {
            navigate('/signup', { state: { marketingAgree: checks.term3 } });
            return;
        }

        alert('필수 약관에 동의해주세요.');
    };

    return {
        checks,
        handleAllCheck,
        handleSingleCheck,
        handlePrev,
        handleNext,
    };
}
