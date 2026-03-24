package com.app.service.push.impl;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.apache.http.HttpResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.app.dao.push.PushDAO;
import com.app.dto.push.NotificationLogDTO;
import com.app.dto.push.PushDispatchResultDTO;
import com.app.dto.push.PushDispatchTargetDTO;
import com.app.dto.push.PushSettingRequest;
import com.app.dto.push.PushSubscriptionDTO;
import com.app.dto.push.PushSubscriptionRequest;
import com.app.dto.push.PushTestNotificationRequest;
import com.app.dto.push.UserNotificationSettingDTO;
import com.app.service.push.PushService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import nl.martijndwars.webpush.Notification;
import nl.martijndwars.webpush.Utils;

@Service
public class PushServiceImpl implements PushService {

    private static final String STATUS_SUCCESS = "SUCCESS";
    private static final String STATUS_FAIL = "FAIL";
    private static final String STATUS_SKIPPED = "SKIPPED";

    private static final String YN_YES = "Y";
    private static final String YN_NO = "N";

    private static final String TYPE_LUNCH = "LUNCH";
    private static final String TYPE_DINNER = "DINNER";
    private static final String TYPE_WEEKEND = "WEEKEND";

    @Autowired
    private PushDAO pushDAO;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public boolean isPushEnabled() {
        return hasText(getPublicVapidKey()) && hasText(getPrivateVapidKey()) && hasText(getVapidSubject());
    }

    @Override
    public String getPublicVapidKey() {
        return readConfigOrDefault("LQ_WEB_PUSH_PUBLIC_KEY", "");
    }

    private String getPrivateVapidKey() {
        return readConfigOrDefault("LQ_WEB_PUSH_PRIVATE_KEY", "");
    }

    private String getVapidSubject() {
        return readConfigOrDefault("LQ_WEB_PUSH_SUBJECT", "mailto:localquest@example.com");
    }

    @Override
    public UserNotificationSettingDTO getNotificationSetting(int userId) {
        UserNotificationSettingDTO setting = pushDAO.findNotificationSettingByUserId(userId);
        if (setting != null) {
            return setting;
        }

        UserNotificationSettingDTO defaultSetting = new UserNotificationSettingDTO();
        defaultSetting.setUserId(userId);
        defaultSetting.setPushAgree(YN_NO);
        defaultSetting.setMarketingAgree(YN_NO);
        defaultSetting.setLunchPushAgree(YN_NO);
        defaultSetting.setDinnerPushAgree(YN_NO);
        defaultSetting.setWeekendPushAgree(YN_NO);
        defaultSetting.setPreferredTimezone("Asia/Seoul");
        return defaultSetting;
    }

    @Override
    @Transactional
    public UserNotificationSettingDTO saveNotificationSetting(int userId, PushSettingRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("request is required");
        }

        UserNotificationSettingDTO currentSetting = pushDAO.findNotificationSettingByUserId(userId);
        if (currentSetting == null) {
            currentSetting = new UserNotificationSettingDTO();
            currentSetting.setUserId(userId);
            currentSetting.setPushAgree(YN_NO);
            currentSetting.setMarketingAgree(YN_NO);
            currentSetting.setLunchPushAgree(YN_NO);
            currentSetting.setDinnerPushAgree(YN_NO);
            currentSetting.setWeekendPushAgree(YN_NO);
            currentSetting.setPreferredTimezone("Asia/Seoul");
            applySettingPatch(currentSetting, request);
            pushDAO.insertNotificationSetting(currentSetting);
        } else {
            applySettingPatch(currentSetting, request);
            pushDAO.updateNotificationSetting(currentSetting);
        }

        return pushDAO.findNotificationSettingByUserId(userId);
    }

    @Override
    @Transactional
    public PushSubscriptionDTO saveSubscription(int userId, PushSubscriptionRequest request) {
        validateSubscriptionRequest(request);
        ensureNotificationSettingExists(userId);

        Map<String, Object> params = new HashMap<>();
        params.put("userId", userId);
        params.put("endpoint", trimToEmpty(request.getEndpoint()));

        PushSubscriptionDTO existing = pushDAO.findSubscriptionByUserAndEndpoint(params);
        if (existing == null) {
            PushSubscriptionDTO newSubscription = new PushSubscriptionDTO();
            newSubscription.setUserId(userId);
            newSubscription.setEndpoint(trimToEmpty(request.getEndpoint()));
            newSubscription.setP256dhKey(trimToEmpty(request.getP256dhKey()));
            newSubscription.setAuthKey(trimToEmpty(request.getAuthKey()));
            newSubscription.setDeviceType(trimToEmpty(request.getDeviceType()));
            newSubscription.setBrowserName(trimToEmpty(request.getBrowserName()));
            newSubscription.setUserAgent(trimToEmpty(request.getUserAgent()));
            newSubscription.setIsActive(YN_YES);
            newSubscription.setFailCount(0);
            pushDAO.insertSubscription(newSubscription);
        } else {
            existing.setP256dhKey(trimToEmpty(request.getP256dhKey()));
            existing.setAuthKey(trimToEmpty(request.getAuthKey()));
            existing.setDeviceType(trimToEmpty(request.getDeviceType()));
            existing.setBrowserName(trimToEmpty(request.getBrowserName()));
            existing.setUserAgent(trimToEmpty(request.getUserAgent()));
            existing.setIsActive(YN_YES);
            existing.setFailCount(0);
            pushDAO.updateSubscription(existing);
        }

        return pushDAO.findSubscriptionByUserAndEndpoint(params);
    }

    private void ensureNotificationSettingExists(int userId) {
        UserNotificationSettingDTO existingSetting = pushDAO.findNotificationSettingByUserId(userId);
        if (existingSetting != null) {
            return;
        }

        UserNotificationSettingDTO newSetting = new UserNotificationSettingDTO();
        newSetting.setUserId(userId);
        newSetting.setPushAgree(YN_YES);
        newSetting.setMarketingAgree(YN_NO);
        newSetting.setLunchPushAgree(YN_NO);
        newSetting.setDinnerPushAgree(YN_NO);
        newSetting.setWeekendPushAgree(YN_NO);
        newSetting.setPreferredTimezone("Asia/Seoul");
        pushDAO.insertNotificationSetting(newSetting);
    }

    @Override
    public List<PushSubscriptionDTO> getActiveSubscriptions(int userId) {
        return pushDAO.findActiveSubscriptionsByUserId(userId);
    }

    @Override
    @Transactional
    public int deactivateSubscription(int userId, String endpoint) {
        String normalizedEndpoint = trimToEmpty(endpoint);
        if (normalizedEndpoint.isEmpty()) {
            return 0;
        }

        Map<String, Object> params = new HashMap<>();
        params.put("userId", userId);
        params.put("endpoint", normalizedEndpoint);
        return pushDAO.deactivateSubscriptionByUserAndEndpoint(params);
    }

    @Override
    @Transactional
    public PushDispatchResultDTO sendTestNotification(int userId, PushTestNotificationRequest request) {
        String type = TYPE_LUNCH;
        String title = "LocalQuest test notification";
        String body = "Push notification has been delivered successfully.";
        String targetUrl = "/main";

        if (request != null) {
            String requestType = normalizeNotificationType(request.getNotificationType());
            if (hasText(requestType)) {
                type = requestType;
            }
            if (hasText(request.getTitle())) {
                title = request.getTitle().trim();
            }
            if (hasText(request.getBody())) {
                body = request.getBody().trim();
            }
            if (hasText(request.getTargetUrl())) {
                targetUrl = request.getTargetUrl().trim();
            }
        }

        List<PushSubscriptionDTO> subscriptions = pushDAO.findActiveSubscriptionsByUserId(userId);
        List<PushDispatchTargetDTO> targets = new ArrayList<>();
        for (PushSubscriptionDTO subscription : subscriptions) {
            PushDispatchTargetDTO target = new PushDispatchTargetDTO();
            target.setUserId(userId);
            target.setSubscriptionId(subscription.getSubscriptionId());
            target.setEndpoint(subscription.getEndpoint());
            target.setP256dhKey(subscription.getP256dhKey());
            target.setAuthKey(subscription.getAuthKey());
            targets.add(target);
        }

        return dispatchNotifications(targets, type, title, body, targetUrl, true);
    }

    @Override
    @Transactional
    public PushDispatchResultDTO sendScheduledNotification(String notificationType, String title, String body, String targetUrl) {
        String normalizedType = normalizeNotificationType(notificationType);
        if (!hasText(normalizedType)) {
            PushDispatchResultDTO emptyResult = new PushDispatchResultDTO();
            emptyResult.setSkippedCount(0);
            emptyResult.setSuccessCount(0);
            emptyResult.setFailCount(0);
            return emptyResult;
        }

        List<PushDispatchTargetDTO> targets = pushDAO.findDispatchTargets(normalizedType);
        return dispatchNotifications(targets, normalizedType, title, body, targetUrl, false);
    }

    @Override
    @Transactional
    public int markNotificationClicked(long notificationId) {
        if (notificationId <= 0L) {
            return 0;
        }
        return pushDAO.markNotificationClicked(notificationId);
    }

    private PushDispatchResultDTO dispatchNotifications(
        List<PushDispatchTargetDTO> targets,
        String notificationType,
        String title,
        String body,
        String targetUrl,
        boolean allowDuplicate
    ) {
        PushDispatchResultDTO result = new PushDispatchResultDTO();
        if (targets == null || targets.isEmpty()) {
            return result;
        }

        String normalizedTitle = trimToMaxLength(title, 200);
        String normalizedBody = trimToMaxLength(body, 500);
        String normalizedTargetUrl = trimToMaxLength(targetUrl, 500);

        for (PushDispatchTargetDTO target : targets) {
            if (target == null || target.getSubscriptionId() == null) {
                continue;
            }

            if (!allowDuplicate && isDuplicateForToday(target.getSubscriptionId(), notificationType)) {
                insertSkippedLog(
                    target,
                    notificationType,
                    normalizedTitle,
                    normalizedBody,
                    normalizedTargetUrl,
                    "DUPLICATED_TODAY"
                );
                result.setSkippedCount(result.getSkippedCount() + 1);
                continue;
            }

            DispatchOutcome outcome = sendNotificationToTarget(
                target,
                notificationType,
                normalizedTitle,
                normalizedBody,
                normalizedTargetUrl
            );
            if (outcome == DispatchOutcome.SUCCESS) {
                result.setSuccessCount(result.getSuccessCount() + 1);
            } else if (outcome == DispatchOutcome.SKIPPED) {
                result.setSkippedCount(result.getSkippedCount() + 1);
            } else {
                result.setFailCount(result.getFailCount() + 1);
            }
        }

        return result;
    }

    private boolean isDuplicateForToday(Long subscriptionId, String notificationType) {
        Map<String, Object> params = new HashMap<>();
        params.put("subscriptionId", subscriptionId);
        params.put("notificationType", notificationType);
        return pushDAO.countTodaySuccessForSubscription(params) > 0;
    }

    private void insertSkippedLog(
        PushDispatchTargetDTO target,
        String notificationType,
        String title,
        String body,
        String targetUrl,
        String reason
    ) {
        Long notificationId = nextNotificationLogId();
        if (notificationId == null) {
            return;
        }

        NotificationLogDTO notificationLog = new NotificationLogDTO();
        notificationLog.setNotificationId(notificationId);
        notificationLog.setUserId(target.getUserId());
        notificationLog.setSubscriptionId(target.getSubscriptionId());
        notificationLog.setNotificationType(notificationType);
        notificationLog.setTitle(title);
        notificationLog.setBody(body);
        notificationLog.setTargetUrl(targetUrl);
        notificationLog.setSendStatus(STATUS_SKIPPED);
        notificationLog.setFailReason(trimToMaxLength(reason, 500));
        notificationLog.setSentAt(LocalDateTime.now());
        pushDAO.insertNotificationLog(notificationLog);
    }

    private DispatchOutcome sendNotificationToTarget(
        PushDispatchTargetDTO target,
        String notificationType,
        String title,
        String body,
        String targetUrl
    ) {
        Long notificationId = nextNotificationLogId();
        if (notificationId == null) {
            return DispatchOutcome.FAIL;
        }

        NotificationLogDTO notificationLog = new NotificationLogDTO();
        notificationLog.setNotificationId(notificationId);
        notificationLog.setUserId(target.getUserId());
        notificationLog.setSubscriptionId(target.getSubscriptionId());
        notificationLog.setNotificationType(notificationType);
        notificationLog.setTitle(title);
        notificationLog.setBody(body);
        notificationLog.setTargetUrl(targetUrl);
        notificationLog.setSentAt(LocalDateTime.now());

        if (!isPushEnabled()) {
            notificationLog.setSendStatus(STATUS_FAIL);
            notificationLog.setFailReason("VAPID key is not configured");
            pushDAO.insertNotificationLog(notificationLog);
            return DispatchOutcome.FAIL;
        }

        try {
            String payload = buildPayload(notificationId.longValue(), notificationType, title, body, targetUrl);
            int statusCode = sendWebPush(target, payload);
            if (statusCode >= 200 && statusCode < 300) {
                notificationLog.setSendStatus(STATUS_SUCCESS);
                notificationLog.setFailReason(null);
                pushDAO.insertNotificationLog(notificationLog);
                pushDAO.markSubscriptionSuccess(target.getSubscriptionId().longValue());
                return DispatchOutcome.SUCCESS;
            }

            notificationLog.setSendStatus(STATUS_FAIL);
            notificationLog.setFailReason(trimToMaxLength("HTTP_" + statusCode, 500));
            pushDAO.insertNotificationLog(notificationLog);

            Map<String, Object> failureParam = new HashMap<>();
            failureParam.put("subscriptionId", target.getSubscriptionId());
            failureParam.put("forceDeactivate", (statusCode == 404 || statusCode == 410) ? YN_YES : YN_NO);
            pushDAO.markSubscriptionFailure(failureParam);
            return DispatchOutcome.FAIL;
        } catch (Exception e) {
            notificationLog.setSendStatus(STATUS_FAIL);
            notificationLog.setFailReason(trimToMaxLength(trimToEmpty(e.getMessage()), 500));
            pushDAO.insertNotificationLog(notificationLog);

            Map<String, Object> failureParam = new HashMap<>();
            failureParam.put("subscriptionId", target.getSubscriptionId());
            failureParam.put("forceDeactivate", YN_NO);
            pushDAO.markSubscriptionFailure(failureParam);
            return DispatchOutcome.FAIL;
        }
    }

    private Long nextNotificationLogId() {
        return pushDAO.nextNotificationLogId();
    }

    private int sendWebPush(PushDispatchTargetDTO target, String payload) throws Exception {
        nl.martijndwars.webpush.PushService pushService = new nl.martijndwars.webpush.PushService();
        pushService.setSubject(getVapidSubject());
        pushService.setPublicKey(Utils.loadPublicKey(getPublicVapidKey()));
        pushService.setPrivateKey(Utils.loadPrivateKey(getPrivateVapidKey()));

        Notification notification = new Notification(
            target.getEndpoint(),
            target.getP256dhKey(),
            target.getAuthKey(),
            payload.getBytes(StandardCharsets.UTF_8)
        );

        HttpResponse httpResponse = pushService.send(notification);
        if (httpResponse == null || httpResponse.getStatusLine() == null) {
            return 500;
        }

        return httpResponse.getStatusLine().getStatusCode();
    }

    private String buildPayload(long notificationId, String type, String title, String body, String targetUrl) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("title", title);
        payload.put("body", body);

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("notificationId", Long.valueOf(notificationId));
        data.put("type", type);
        data.put("targetUrl", targetUrl);
        payload.put("data", data);

        try {
            return objectMapper.writeValueAsString(payload);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("failed to build payload", e);
        }
    }

    private void applySettingPatch(UserNotificationSettingDTO setting, PushSettingRequest request) {
        if (request.getPushAgree() != null) {
            setting.setPushAgree(toYn(request.getPushAgree().booleanValue()));
        }
        if (request.getMarketingAgree() != null) {
            setting.setMarketingAgree(toYn(request.getMarketingAgree().booleanValue()));
        }
        if (request.getLunchPushAgree() != null) {
            setting.setLunchPushAgree(toYn(request.getLunchPushAgree().booleanValue()));
        }
        if (request.getDinnerPushAgree() != null) {
            setting.setDinnerPushAgree(toYn(request.getDinnerPushAgree().booleanValue()));
        }
        if (request.getWeekendPushAgree() != null) {
            setting.setWeekendPushAgree(toYn(request.getWeekendPushAgree().booleanValue()));
        }
        if (request.getPreferredTimezone() != null) {
            String timezone = request.getPreferredTimezone().trim();
            setting.setPreferredTimezone(timezone.isEmpty() ? "Asia/Seoul" : trimToMaxLength(timezone, 50));
        }
    }

    private void validateSubscriptionRequest(PushSubscriptionRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("request is required");
        }
        if (!hasText(request.getEndpoint()) || !hasText(request.getP256dhKey()) || !hasText(request.getAuthKey())) {
            throw new IllegalArgumentException("endpoint, p256dhKey, authKey are required");
        }
    }

    private String normalizeNotificationType(String notificationType) {
        String normalized = trimToEmpty(notificationType).toUpperCase();
        if (TYPE_LUNCH.equals(normalized) || TYPE_DINNER.equals(normalized) || TYPE_WEEKEND.equals(normalized)) {
            return normalized;
        }
        return "";
    }

    private String toYn(boolean value) {
        return value ? YN_YES : YN_NO;
    }

    private String readConfigOrDefault(String key, String defaultValue) {
        String envValue = trimToEmpty(System.getenv(key));
        if (hasText(envValue)) {
            return envValue;
        }

        String propertyValue = trimToEmpty(System.getProperty(key));
        if (hasText(propertyValue)) {
            return propertyValue;
        }

        return defaultValue;
    }

    private String trimToMaxLength(String value, int maxLength) {
        String normalized = trimToEmpty(value);
        if (normalized.length() <= maxLength) {
            return normalized;
        }
        return normalized.substring(0, maxLength);
    }

    private String trimToEmpty(String value) {
        return value == null ? "" : value.trim();
    }

    private boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }

    private enum DispatchOutcome {
        SUCCESS,
        FAIL,
        SKIPPED
    }
}
