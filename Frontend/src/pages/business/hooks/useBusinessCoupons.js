import { useCallback, useMemo, useState } from 'react';
import { INITIAL_ACTIVE_COUPONS, INITIAL_PROPOSED_COUPONS } from '../utils/businessConstants';

export function useBusinessCoupons(showToast) {
  const [proposedCoupons, setProposedCoupons] = useState(INITIAL_PROPOSED_COUPONS);
  const [activeCoupons, setActiveCoupons] = useState(INITIAL_ACTIVE_COUPONS);

  const proposedCouponCount = useMemo(
    () => proposedCoupons.filter((coupon) => coupon.status === 'proposed').length,
    [proposedCoupons]
  );

  const runningCouponCount = useMemo(
    () => activeCoupons.filter((coupon) => coupon.status === 'running').length,
    [activeCoupons]
  );

  const weeklyCouponUseCount = useMemo(
    () =>
      activeCoupons
        .filter((coupon) => coupon.status === 'running')
        .reduce((sum, coupon) => sum + Number(coupon.thisWeekCount || 0), 0),
    [activeCoupons]
  );

  const acceptCoupon = useCallback(
    (couponId) => {
      setProposedCoupons((prev) => {
        const found = prev.find((coupon) => coupon.id === couponId);
        if (!found || found.status !== 'proposed') {
          return prev;
        }

        setActiveCoupons((activePrev) => [
          ...activePrev,
          {
            id: found.id,
            icon: found.icon,
            title: found.title,
            description: found.description,
            benefit: found.benefit,
            totalUsedText: '0건',
            thisWeekText: '0건',
            thisWeekCount: 0,
            status: 'running'
          }
        ]);

        showToast('쿠폰이 수락되어 앱에 노출됩니다.');
        return prev.map((coupon) => (coupon.id === couponId ? { ...coupon, status: 'accepted' } : coupon));
      });
    },
    [showToast]
  );

  const holdCoupon = useCallback(
    (couponId) => {
      setProposedCoupons((prev) =>
        prev.map((coupon) => (coupon.id === couponId && coupon.status === 'proposed' ? { ...coupon, status: 'held' } : coupon))
      );
      showToast('운영팀에게 재검토 요청을 전달했습니다.');
    },
    [showToast]
  );

  const pauseCoupon = useCallback(
    (couponId) => {
      setActiveCoupons((prev) =>
        prev.map((coupon) => (coupon.id === couponId ? { ...coupon, status: 'paused' } : coupon))
      );
      showToast('쿠폰을 일시 중단했습니다.');
    },
    [showToast]
  );

  const resumeCoupon = useCallback(
    (couponId) => {
      setActiveCoupons((prev) =>
        prev.map((coupon) => (coupon.id === couponId ? { ...coupon, status: 'running' } : coupon))
      );
      showToast('쿠폰이 다시 노출됩니다.');
    },
    [showToast]
  );

  return {
    proposedCoupons,
    activeCoupons,
    proposedCouponCount,
    runningCouponCount,
    weeklyCouponUseCount,
    acceptCoupon,
    holdCoupon,
    pauseCoupon,
    resumeCoupon
  };
}
