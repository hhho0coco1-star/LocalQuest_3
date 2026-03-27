import {
    formatReviewCreatedAt,
    resolveInquiryStatusLabel,
} from '../../utils/mypage/myPageUtils';

function InquiryTab({
    isMyInquiriesLoading,
    myInquiriesError,
    myInquiries,
}) {
    return (
        <section className="mypage-inquiry-panel">
            <h2>1:1 문의내역</h2>
            {isMyInquiriesLoading ? (
                <div className="mypage-loading">문의내역을 불러오는 중입니다.</div>
            ) : myInquiriesError ? (
                <p className="mypage-feedback-message is-error">{myInquiriesError}</p>
            ) : myInquiries.length === 0 ? (
                <p className="mypage-inquiry-empty">등록한 문의가 없습니다.</p>
            ) : (
                <div className="mypage-inquiry-list">
                    {myInquiries.map((inquiry) => (
                        <article key={inquiry.inquiryId} className="mypage-inquiry-item">
                            <div className="mypage-inquiry-head">
                                <strong>{inquiry.title || `문의 #${inquiry.inquiryId}`}</strong>
                                <span className={`mypage-inquiry-status ${String(inquiry.status || '').toUpperCase() === 'ANSWERED' ? 'is-answered' : 'is-pending'}`}>
                                    {resolveInquiryStatusLabel(inquiry.status)}
                                </span>
                            </div>
                            <p className="mypage-inquiry-date">등록일: {formatReviewCreatedAt(inquiry.createdAt)}</p>
                            <p className="mypage-inquiry-content">{inquiry.content || '-'}</p>
                            {String(inquiry.status || '').toUpperCase() === 'ANSWERED' ? (
                                <div className="mypage-inquiry-answer">
                                    <p className="mypage-inquiry-answer-date">답변일: {formatReviewCreatedAt(inquiry.answeredAt)}</p>
                                    <p className="mypage-inquiry-answer-content">{inquiry.answerContent || '-'}</p>
                                </div>
                            ) : null}
                        </article>
                    ))}
                </div>
            )}
        </section>
    );
}

export default InquiryTab;
