import { useEffect, useState } from 'react';
import { inquiryApi } from '../../api/InquiryApi';
import { resolveApiErrorMessage } from '../../utils/errorMessage';

export function useMyPageInquiries(activeTab) {
    const [myInquiries, setMyInquiries] = useState([]);
    const [isMyInquiriesLoading, setIsMyInquiriesLoading] = useState(false);
    const [myInquiriesError, setMyInquiriesError] = useState('');

    useEffect(() => {
        let isCancelled = false;

        const fetchMyInquiries = async () => {
            if (activeTab !== 'inquiryHistory') {
                return;
            }

            setIsMyInquiriesLoading(true);
            setMyInquiriesError('');

            try {
                const response = await inquiryApi.getMyInquiries();
                if (isCancelled) {
                    return;
                }
                setMyInquiries(Array.isArray(response.data) ? response.data : []);
            } catch (error) {
                if (isCancelled) {
                    return;
                }

                const message = resolveApiErrorMessage(
                    error,
                    '문의내역을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.'
                );
                setMyInquiriesError(message);
                setMyInquiries([]);
            } finally {
                if (!isCancelled) {
                    setIsMyInquiriesLoading(false);
                }
            }
        };

        fetchMyInquiries();

        return () => {
            isCancelled = true;
        };
    }, [activeTab]);

    return {
        myInquiries,
        isMyInquiriesLoading,
        myInquiriesError,
    };
}
