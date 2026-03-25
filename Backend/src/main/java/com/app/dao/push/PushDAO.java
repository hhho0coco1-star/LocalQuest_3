package com.app.dao.push;

import java.util.List;
import java.util.Map;

import com.app.dto.push.NotificationLogDTO;
import com.app.dto.push.PushDispatchTargetDTO;
import com.app.dto.push.PushSubscriptionDTO;
import com.app.dto.push.UserNotificationSettingDTO;

public interface PushDAO {
    public UserNotificationSettingDTO findNotificationSettingByUserId(int userId);
    public int insertNotificationSetting(UserNotificationSettingDTO setting);
    public int updateNotificationSetting(UserNotificationSettingDTO setting);

    public PushSubscriptionDTO findSubscriptionByUserAndEndpoint(Map<String, Object> params);
    public int insertSubscription(PushSubscriptionDTO subscription);
    public int updateSubscription(PushSubscriptionDTO subscription);
    public int deactivateSubscriptionByUserAndEndpoint(Map<String, Object> params);
    public List<PushSubscriptionDTO> findActiveSubscriptionsByUserId(int userId);

    public List<PushDispatchTargetDTO> findDispatchTargets(String notificationType);
    public int countTodaySuccessForSubscription(Map<String, Object> params);

    public Long nextNotificationLogId();
    public int insertNotificationLog(NotificationLogDTO notificationLog);
    public int markNotificationClicked(long notificationId);

    public int markSubscriptionSuccess(long subscriptionId);
    public int markSubscriptionFailure(Map<String, Object> params);
}
