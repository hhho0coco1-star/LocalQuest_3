import React from 'react';

function BusinessUpdateModal({
  isOpen,
  formState,
  isSaving,
  errorMessage,
  onFieldChange,
  onClose,
  onSubmit
}) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="business-modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="business-modal-box"
        role="dialog"
        aria-modal="true"
        aria-label="매장 정보 업데이트"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="business-modal-head">
          <h3>매장 정보 업데이트</h3>
          <button type="button" className="business-modal-close" onClick={onClose} disabled={isSaving}>
            닫기
          </button>
        </div>

        <form className="business-modal-form" onSubmit={onSubmit}>
          <label className="business-modal-field">
            <span>매장명</span>
            <input
              type="text"
              name="businessName"
              value={formState.businessName}
              onChange={onFieldChange}
              placeholder="매장명을 입력하세요"
              required
              disabled={isSaving}
            />
          </label>

          <label className="business-modal-field">
            <span>전화번호</span>
            <input
              type="text"
              name="phone"
              value={formState.phone}
              onChange={onFieldChange}
              placeholder="전화번호를 입력하세요"
              disabled={isSaving}
            />
          </label>

          <div className="business-modal-row">
            <label className="business-modal-field">
              <span>우편번호</span>
              <input
                type="text"
                name="zipCode"
                value={formState.zipCode}
                onChange={onFieldChange}
                placeholder="우편번호"
                required
                disabled={isSaving}
              />
            </label>

            <label className="business-modal-field">
              <span>상세주소</span>
              <input
                type="text"
                name="addressDetail"
                value={formState.addressDetail}
                onChange={onFieldChange}
                placeholder="상세주소"
                disabled={isSaving}
              />
            </label>
          </div>

          <label className="business-modal-field">
            <span>기본주소</span>
            <input
              type="text"
              name="address"
              value={formState.address}
              onChange={onFieldChange}
              placeholder="주소를 입력하세요"
              required
              disabled={isSaving}
            />
          </label>

          <label className="business-modal-field">
            <span>매장 소개</span>
            <textarea
              name="description"
              value={formState.description}
              onChange={onFieldChange}
              placeholder="매장 소개를 입력하세요"
              rows={4}
              disabled={isSaving}
            />
          </label>

          {errorMessage ? <p className="business-modal-error">{errorMessage}</p> : null}

          <div className="business-modal-actions">
            <button type="button" className="business-btn business-btn-ghost" onClick={onClose} disabled={isSaving}>
              취소
            </button>
            <button type="submit" className="business-btn business-btn-primary" disabled={isSaving}>
              {isSaving ? '저장 중...' : '저장'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default BusinessUpdateModal;
