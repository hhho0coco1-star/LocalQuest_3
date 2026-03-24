package com.app.service.push;

import java.util.List;

import com.app.dto.push.PushDispatchResultDTO;
import com.app.dto.push.PushSettingRequest;
import com.app.dto.push.PushSubscriptionDTO;
import com.app.dto.push.PushSubscriptionRequest;
import com.app.dto.push.PushTestNotificationRequest;
import com.app.dto.push.UserNotificationSettingDTO;

public interface PushService {
    public boolean isPushEnabled();
    public String getPublicVapidKey();

    public UserNotificationSettingDTO getNotificationSetting(int userId);
    public UserNotificationSettingDTO saveNotificationSetting(int userId, PushSettingRequest request);

    public PushSubscriptionDTO saveSubscription(int userId, PushSubscriptionRequest request);
    public List<PushSubscriptionDTO> getActiveSubscriptions(int userId);
    public int deactivateSubscription(int userId, String endpoint);

    public PushDispatchResultDTO sendTestNotification(int userId, PushTestNotificationRequest request);
    public PushDispatchResultDTO sendScheduledNotification(String notificationType, String title, String body, String targetUrl);

    public int markNotificationClicked(long notificationId);
}
