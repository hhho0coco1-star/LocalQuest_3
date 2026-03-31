import { useEffect, useMemo, useState } from 'react';
import { badgeApi } from '../../api/BadgeApi';
import { resolveApiErrorMessage } from '../../utils/errorMessage';
import {
    buildFilteredMyBadgeItems,
    buildMyBadgeHints,
    buildMyBadgeItems,
    buildMyBadgeSummary,
    normalizeBadgeDashboard,
} from '../../utils/mypage/myPageUtils';

export function useMyPageBadges(activeTab) {
    const [myBadgeCatalog, setMyBadgeCatalog] = useState([]);
    const [myEarnedBadges, setMyEarnedBadges] = useState([]);
    const [isMyBadgeLoading, setIsMyBadgeLoading] = useState(false);
    const [myBadgeError, setMyBadgeError] = useState('');
    const [showEarnedBadgeOnly, setShowEarnedBadgeOnly] = useState(false);

    useEffect(() => {
        let isCancelled = false;

        const fetchMyBadgeDashboard = async () => {
            if (activeTab !== 'myBadges') {
                return;
            }

            setIsMyBadgeLoading(true);
            setMyBadgeError('');

            try {
                const response = await badgeApi.getMyBadgeDashboard();
                if (isCancelled) {
                    return;
                }

                const normalized = normalizeBadgeDashboard(response.data);
                setMyBadgeCatalog(normalized.catalog);
                setMyEarnedBadges(normalized.earnedBadges);
            } catch (error) {
                if (isCancelled) {
                    return;
                }

                const message = resolveApiErrorMessage(
                    error,
                    '배지 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.'
                );
                setMyBadgeError(message);
                setMyBadgeCatalog([]);
                setMyEarnedBadges([]);
            } finally {
                if (!isCancelled) {
                    setIsMyBadgeLoading(false);
                }
            }
        };

        fetchMyBadgeDashboard();

        return () => {
            isCancelled = true;
        };
    }, [activeTab]);

    const myBadgeItems = useMemo(
        () => buildMyBadgeItems(myBadgeCatalog, myEarnedBadges),
        [myBadgeCatalog, myEarnedBadges]
    );

    const myBadgeSummary = useMemo(
        () => buildMyBadgeSummary(myBadgeItems),
        [myBadgeItems]
    );

    const myBadgeHints = useMemo(
        () => buildMyBadgeHints(myBadgeItems),
        [myBadgeItems]
    );

    const filteredMyBadgeItems = useMemo(
        () => buildFilteredMyBadgeItems(myBadgeItems, showEarnedBadgeOnly),
        [showEarnedBadgeOnly, myBadgeItems]
    );

    return {
        isMyBadgeLoading,
        myBadgeError,
        myBadgeSummary,
        myBadgeHints,
        filteredMyBadgeItems,
        showEarnedBadgeOnly,
        setShowEarnedBadgeOnly,
    };
}
