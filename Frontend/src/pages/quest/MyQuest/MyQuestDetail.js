import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { questApi } from '../../../api/QuestApi';
import '../QuestDetail/QuestDetail.css';
import './MyQuestDetail.css';

const getDifficultyText = (rewardExp) => {
  if (rewardExp >= 300) return '어려움';
  if (rewardExp >= 180) return '보통';
  return '쉬움';
};

const formatDuration = (timeLimit) => (timeLimit ? `${timeLimit}분` : '제한 없음');

const formatDateTime = (value) => {
  if (!value) {
    return '-';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return '-';
  }

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const date = String(parsed.getDate()).padStart(2, '0');
  return `${year}.${month}.${date}`;
};

const getQuestStatusLabel = (status) => {
  if (status === 'IN_PROGRESS') return '진행 중';
  if (status === 'SAVED') return '저장됨';
  if (status === 'COMPLETED') return '완료';
  return status || '알 수 없음';
};

function MyQuestDetail() {
  const navigate = useNavigate();
  const { userQuestId } = useParams();
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedReceiptFile, setSelectedReceiptFile] = useState(null);
  const [receiptPreviewUrl, setReceiptPreviewUrl] = useState('');
  const [receiptError, setReceiptError] = useState('');
  const [receiptUploads, setReceiptUploads] = useState({});
  const [isSubmittingReceipt, setIsSubmittingReceipt] = useState(false);
  const [receiptFailure, setReceiptFailure] = useState(null);

  useEffect(() => {
    let isCancelled = false;

    const fetchMyQuestDetail = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await questApi.getMyQuestDetail(userQuestId);
        if (!isCancelled) {
          setDetail(response.data);
        }
      } catch (err) {
        if (!isCancelled) {
          setError('내 퀘스트 상세 정보를 불러오지 못했습니다.');
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    fetchMyQuestDetail();

    return () => {
      isCancelled = true;
    };
  }, [userQuestId]);

  useEffect(() => {
    return () => {
      if (receiptPreviewUrl) {
        URL.revokeObjectURL(receiptPreviewUrl);
      }
    };
  }, [receiptPreviewUrl]);

  const locationSummary = useMemo(() => {
    const locations = Array.isArray(detail?.locations) ? detail.locations : [];
    return locations.length
      ? locations.map((location) => location.name).join(', ')
      : '지정된 장소 정보가 없습니다.';
  }, [detail?.locations]);

  const closeReceiptModal = (options = {}) => {
    const { force = false } = options;

    if (isSubmittingReceipt && !force) {
      return;
    }

    if (receiptPreviewUrl) {
      URL.revokeObjectURL(receiptPreviewUrl);
    }
    setSelectedLocation(null);
    setSelectedReceiptFile(null);
    setReceiptPreviewUrl('');
    setReceiptError('');
  };

  const openReceiptModal = (location) => {
    closeReceiptModal();
    setReceiptFailure(null);
    setSelectedLocation(location);
  };

  const handleReceiptFileChange = (event) => {
    const file = event.target.files?.[0];

    if (receiptPreviewUrl) {
      URL.revokeObjectURL(receiptPreviewUrl);
    }

    if (!file) {
      setSelectedReceiptFile(null);
      setReceiptPreviewUrl('');
      setReceiptError('');
      return;
    }

    if (!file.type.startsWith('image/')) {
      setSelectedReceiptFile(null);
      setReceiptPreviewUrl('');
      setReceiptError('이미지 파일만 업로드할 수 있습니다.');
      return;
    }

    setSelectedReceiptFile(file);
    setReceiptPreviewUrl(URL.createObjectURL(file));
    setReceiptError('');
  };

  const closeReceiptFailureModal = () => {
    setReceiptFailure(null);
  };

  const handleReceiptSubmit = async (event) => {
    event.preventDefault();

    if (!selectedLocation) {
      return;
    }

    if (!selectedReceiptFile) {
      setReceiptError('영수증 사진을 먼저 선택해주세요.');
      return;
    }

    try {
      setIsSubmittingReceipt(true);
      setReceiptError('');

      const formData = new FormData();
      formData.append('receiptImage', selectedReceiptFile);

      const response = await questApi.verifyQuestReceipt(
        userQuestId,
        selectedLocation.questLocationId,
        formData
      );
      const result = response.data || {};

      if (result.verified) {
        setReceiptUploads((prev) => ({
          ...prev,
          [selectedLocation.questLocationId]: {
            fileName: selectedReceiptFile.name,
            uploadedAt: new Date().toISOString(),
          },
        }));

        if (result.detail) {
          setDetail(result.detail);
        }

        closeReceiptModal({ force: true });
        return;
      }

      const failureLocationName = selectedLocation.name;
      closeReceiptModal({ force: true });
      setReceiptFailure({
        locationName: failureLocationName,
        message: result.message || '영수증 인증에 실패했습니다.',
        reason: result.reason || '',
      });
    } catch (err) {
      const message =
        err.response?.data?.message ||
        (typeof err.response?.data === 'string' ? err.response.data : '') ||
        '영수증 인증 중 오류가 발생했습니다.';
      setReceiptError(message);
    } finally {
      setIsSubmittingReceipt(false);
    }
  };

  return (
    <div className="quest-detail-page">
      <div className="quest-detail-main">
        <button type="button" className="quest-detail-back" onClick={() => navigate('/mypage')}>
          내 퀘스트로 돌아가기
        </button>

        {loading ? (
          <section className="quest-detail-empty">
            <h1>내 퀘스트 상세를 불러오는 중입니다.</h1>
          </section>
        ) : detail ? (
          <section className="quest-detail-card">
            <div className="quest-detail-head">
              <div>
                <span className="quest-detail-category">{detail.category}</span>
                <h1>{detail.title}</h1>
                <p>{detail.description}</p>
              </div>
              <div className="quest-detail-summary">
                <strong>{detail.rewardPoint}P</strong>
                <span>보상</span>
              </div>
            </div>

            <div className="quest-detail-meta">
              <article>
                <span>난이도</span>
                <strong>{getDifficultyText(detail.rewardExp)}</strong>
              </article>
              <article>
                <span>포함 장소</span>
                <strong>{locationSummary}</strong>
              </article>
              <article>
                <span>제한 시간</span>
                <strong>{formatDuration(detail.timeLimit)}</strong>
              </article>
            </div>

            <div className="my-quest-detail-progress-panel">
              <div className="my-quest-detail-progress-head">
                <h2>내 진행 상태</h2>
                <span className={`my-quest-detail-status is-${String(detail.questStatus || '').toLowerCase()}`}>
                  {getQuestStatusLabel(detail.questStatus)}
                </span>
              </div>

              <div className="my-quest-detail-progress-grid">
                <article>
                  <span>진행률</span>
                  <strong>{detail.progressPercent}%</strong>
                </article>
                <article>
                  <span>완료한 장소</span>
                  <strong>{detail.completedLocationCount}/{detail.totalLocationCount}</strong>
                </article>
                <article>
                  <span>시작일</span>
                  <strong>{formatDateTime(detail.startedAt)}</strong>
                </article>
                <article>
                  <span>완료일</span>
                  <strong>{formatDateTime(detail.completedAt)}</strong>
                </article>
              </div>

              <div className="my-quest-detail-progress-bar">
                <span style={{ width: `${detail.progressPercent}%` }} />
              </div>
            </div>

            <div className="quest-detail-steps">
              <h2>방문 순서</h2>
              {Array.isArray(detail.locations) && detail.locations.length > 0 ? (
                <div className="quest-detail-location-list">
                  {detail.locations.map((location) => {
                    const uploadedReceipt = receiptUploads[location.questLocationId];
                    const isCompleted = Number(location.isCompleted) === 1;

                    return (
                      <article
                        key={location.questLocationId || location.locationId}
                        className={`quest-detail-location-item my-quest-detail-location-item${
                          isCompleted ? ' is-completed' : ''
                        }`}
                      >
                        <div className="quest-detail-location-order">{location.visitOrder}</div>
                        <div className="quest-detail-location-body">
                          <div className="my-quest-detail-location-head">
                            <h3>{location.name}</h3>
                            <span
                              className={`my-quest-detail-location-badge${
                                isCompleted ? ' is-completed' : ''
                              }`}
                            >
                              {isCompleted ? '완료' : '미완료'}
                            </span>
                          </div>
                        {location.address && <p>{location.address}</p>}
                        {location.addressDetail && <p>{location.addressDetail}</p>}
                        {location.description ? (
                          <span className="quest-detail-location-note">{location.description}</span>
                        ) : null}
                        {isCompleted ? (
                          <span className="my-quest-detail-completed-at">
                            완료일 {formatDateTime(location.completedAt)}
                          </span>
                        ) : (
                          <div className="my-quest-detail-verification">
                            <button
                              type="button"
                              className="my-quest-detail-verify-btn"
                              onClick={() => openReceiptModal(location)}
                            >
                              {uploadedReceipt ? '영수증 다시 올리기' : '인증하기'}
                            </button>
                            {uploadedReceipt ? (
                              <span className="my-quest-detail-uploaded-note">
                                영수증 업로드됨: {uploadedReceipt.fileName}
                              </span>
                            ) : null}
                          </div>
                        )}
                      </div>
                    </article>
                  );
                  })}
                </div>
              ) : (
                <p className="quest-detail-empty-copy">아직 연결된 로케이션이 없습니다.</p>
              )}
            </div>
          </section>
        ) : (
          <section className="quest-detail-empty">
            <h1>{error || '내 퀘스트를 찾을 수 없습니다.'}</h1>
            <p>내 퀘스트 목록으로 돌아가 다시 선택해주세요.</p>
          </section>
        )}
      </div>

      {selectedLocation ? (
        <div className="my-quest-receipt-modal-overlay" onClick={closeReceiptModal}>
          <div className="my-quest-receipt-modal" onClick={(event) => event.stopPropagation()}>
            <div className="my-quest-receipt-modal-head">
              <div>
                <span className="my-quest-receipt-chip">영수증 인증</span>
                <h2>{selectedLocation.name}</h2>
              </div>
              <button type="button" className="my-quest-receipt-close" onClick={closeReceiptModal}>
                ×
              </button>
            </div>

            <p className="my-quest-receipt-copy">
              영수증 사진을 올리면 해당 장소의 인증 자료로 사용할 수 있습니다.
            </p>

            <form className="my-quest-receipt-form" onSubmit={handleReceiptSubmit}>
              <label className="my-quest-receipt-upload-box" htmlFor="receipt-upload">
                <input
                  id="receipt-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleReceiptFileChange}
                />
                <strong>영수증 사진 선택</strong>
                <span>JPG, PNG 등 이미지 파일을 올려주세요.</span>
              </label>

              {selectedReceiptFile ? (
                <div className="my-quest-receipt-file-meta">
                  <strong>{selectedReceiptFile.name}</strong>
                  <span>{Math.round(selectedReceiptFile.size / 1024)}KB</span>
                </div>
              ) : null}

              {receiptPreviewUrl ? (
                <div className="my-quest-receipt-preview-wrap">
                  <img
                    className="my-quest-receipt-preview"
                    src={receiptPreviewUrl}
                    alt="영수증 미리보기"
                  />
                </div>
              ) : null}

              {receiptError ? <p className="my-quest-receipt-error">{receiptError}</p> : null}

              <p className="my-quest-receipt-helper">
                영수증을 업로드하면 자동으로 매장명과 인증 여부를 확인합니다.
              </p>

              <div className="my-quest-receipt-actions">
                <button
                  type="button"
                  className="my-quest-receipt-cancel"
                  onClick={closeReceiptModal}
                  disabled={isSubmittingReceipt}
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="my-quest-receipt-submit"
                  disabled={isSubmittingReceipt}
                >
                  {isSubmittingReceipt ? '인증 확인 중...' : '영수증 업로드'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {receiptFailure ? (
        <div className="my-quest-receipt-modal-overlay" onClick={closeReceiptFailureModal}>
          <div className="my-quest-receipt-result-modal" onClick={(event) => event.stopPropagation()}>
            <span className="my-quest-receipt-result-chip is-failed">인증 실패</span>
            <h2>{receiptFailure.locationName}</h2>
            <p className="my-quest-receipt-result-copy">{receiptFailure.message}</p>
            {receiptFailure.reason ? (
              <p className="my-quest-receipt-result-reason">{receiptFailure.reason}</p>
            ) : null}
            <div className="my-quest-receipt-actions">
              <button
                type="button"
                className="my-quest-receipt-submit"
                onClick={closeReceiptFailureModal}
              >
                확인
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default MyQuestDetail;
