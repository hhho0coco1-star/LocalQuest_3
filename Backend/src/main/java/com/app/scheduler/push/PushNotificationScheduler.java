package com.app.scheduler.push;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.app.dto.push.PushDispatchResultDTO;
import com.app.service.push.PushService;

@Component
public class PushNotificationScheduler {

    private static final Logger logger = LoggerFactory.getLogger(PushNotificationScheduler.class);

    @Autowired
    private PushService pushService;

    @Scheduled(cron = "0 30 11 ? * MON-FRI", zone = "Asia/Seoul")
    public void sendLunchNotification() {
        dispatch(
            "LUNCH",
            "점심 30분, 오늘 미션 하나 완료해볼까요?",
            "근처 퀘스트 1개만 완료해도 포인트를 받을 수 있어요.",
            "/explore"
        );
    }

    @Scheduled(cron = "0 30 17 ? * MON-FRI", zone = "Asia/Seoul")
    public void sendDinnerNotification() {
        dispatch(
            "DINNER",
            "퇴근길 저녁 퀘스트가 열렸어요",
            "집 가기 전 15분, 오늘의 로컬 미션을 확인해보세요.",
            "/explore"
        );
    }

    @Scheduled(cron = "0 0 10 ? * SAT,SUN", zone = "Asia/Seoul")
    public void sendWeekendNotification() {
        dispatch(
            "WEEKEND",
            "주말 오전 한정 퀘스트 오픈",
            "이번 주말에만 가능한 미션이 추가됐어요. 지금 확인해보세요.",
            "/main"
        );
    }

    private void dispatch(String type, String title, String body, String targetUrl) {
        try {
            PushDispatchResultDTO result = pushService.sendScheduledNotification(type, title, body, targetUrl);
            logger.info("[PushScheduler] type={} success={} fail={} skipped={}",
                type,
                Integer.valueOf(result.getSuccessCount()),
                Integer.valueOf(result.getFailCount()),
                Integer.valueOf(result.getSkippedCount())
            );
        } catch (Exception e) {
            logger.error("[PushScheduler] type={} failed", type, e);
        }
    }
}
