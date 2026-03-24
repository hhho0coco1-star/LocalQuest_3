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
        dispatch("LUNCH", "점심 시간 알림", "가까운 로컬 미션과 함께 점심 시간을 즐겨보세요.", "/explore");
    }

    @Scheduled(cron = "0 30 17 ? * MON-FRI", zone = "Asia/Seoul")
    public void sendDinnerNotification() {
        dispatch("DINNER", "저녁 시간 알림", "퇴근길에 참여할 수 있는 퀘스트를 확인해보세요.", "/explore");
    }

    @Scheduled(cron = "0 0 10 ? * SAT,SUN", zone = "Asia/Seoul")
    public void sendWeekendNotification() {
        dispatch("WEEKEND", "주말 오전 알림", "주말 전용 로컬 퀘스트가 열렸어요. 지금 확인해보세요.", "/main");
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
