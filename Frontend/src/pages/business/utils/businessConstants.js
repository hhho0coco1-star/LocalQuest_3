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

export const INITIAL_PROPOSED_COUPONS = [
  {
    id: 'coupon-proposal-lunch',
    icon: '☕',
    title: '점심 퀘스트 완료 쿠폰',
    description: '평일 11:30 퀘스트 수행 고객 대상',
    benefit: '아메리카노 500원 할인',
    timeWindow: '당일 14:00까지',
    expectedLift: '+8~12명/일',
    status: 'proposed'
  },
  {
    id: 'coupon-proposal-evening',
    icon: '🌙',
    title: '퇴근길 퀘스트 쿠폰',
    description: '평일 17:30 퀘스트 수행 고객 대상',
    benefit: '음료 1+1 이벤트',
    timeWindow: '당일 20:00까지',
    expectedLift: '+5~9명/일',
    status: 'proposed'
  }
];

export const INITIAL_ACTIVE_COUPONS = [
  {
    id: 'coupon-running-weekend',
    icon: '🏃',
    title: '주말 러닝 퀘스트 쿠폰',
    description: '주말 10:00 퀘스트 수행 고객 대상',
    benefit: '에너지바 증정',
    totalUsedText: '37건',
    thisWeekText: '8건',
    thisWeekCount: 8,
    status: 'running'
  }
];

export const TAB_ITEMS = [
  { key: 'home', label: '홈 대시보드' },
  { key: 'qr', label: 'QR 코드 발급' },
  { key: 'coupon', label: '쿠폰 설정' }
];

export const KOREAN_WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];
