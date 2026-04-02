export const EMPTY_DASHBOARD = {
  totalAuthCount: 0,
  qrAuthCount: 0,
  receiptAuthCount: 0,
  totalPaymentAmount: 0,
  totalSettlementAmount: 0,
  lastAuthAt: null,
  authUserCount: 0,
  authLocationCount: 0,
  hourlyAuthCounts: []
};

export const INITIAL_PROPOSED_COUPONS = [];

export const INITIAL_ACTIVE_COUPONS = [];

export const TAB_ITEMS = [
  { key: 'home', label: '홈 대시보드' },
  { key: 'qr', label: 'QR 코드 발급' },
  { key: 'coupon', label: '쿠폰 설정' }
];

export const KOREAN_WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];
