import { useState } from 'react';
import { useMyPageBadges } from './useMyPageBadges';
import { useMyPageInquiries } from './useMyPageInquiries';
import { useMyPageProfile } from './useMyPageProfile';

export function useMyPage() {
    const [activeTab, setActiveTab] = useState('profile');

    const profileState = useMyPageProfile();
    const badgeState = useMyPageBadges(activeTab);
    const inquiryState = useMyPageInquiries(activeTab);

    return {
        activeTab,
        setActiveTab,
        ...profileState,
        ...badgeState,
        ...inquiryState,
    };
}
