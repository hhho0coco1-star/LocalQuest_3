package com.app.dao.push.impl;

import java.util.List;
import java.util.Map;

import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import com.app.dao.push.PushDAO;
import com.app.dto.push.NotificationLogDTO;
import com.app.dto.push.PushDispatchTargetDTO;
import com.app.dto.push.PushSubscriptionDTO;
import com.app.dto.push.UserNotificationSettingDTO;

@Repository
public class PushDAOImpl implements PushDAO {

    @Autowired
    private SqlSessionTemplate sqlSessionTemplate;

    @Override
    public UserNotificationSettingDTO findNotificationSettingByUserId(int userId) {
        return sqlSessionTemplate.selectOne("push_mapper.findNotificationSettingByUserId", userId);
    }

    @Override
    public int insertNotificationSetting(UserNotificationSettingDTO setting) {
        return sqlSessionTemplate.insert("push_mapper.insertNotificationSetting", setting);
    }

    @Override
    public int updateNotificationSetting(UserNotificationSettingDTO setting) {
        return sqlSessionTemplate.update("push_mapper.updateNotificationSetting", setting);
    }

    @Override
    public PushSubscriptionDTO findSubscriptionByUserAndEndpoint(Map<String, Object> params) {
        return sqlSessionTemplate.selectOne("push_mapper.findSubscriptionByUserAndEndpoint", params);
    }

    @Override
    public int insertSubscription(PushSubscriptionDTO subscription) {
        return sqlSessionTemplate.insert("push_mapper.insertSubscription", subscription);
    }

    @Override
    public int updateSubscription(PushSubscriptionDTO subscription) {
        return sqlSessionTemplate.update("push_mapper.updateSubscription", subscription);
    }

    @Override
    public int deactivateSubscriptionByUserAndEndpoint(Map<String, Object> params) {
        return sqlSessionTemplate.update("push_mapper.deactivateSubscriptionByUserAndEndpoint", params);
    }

    @Override
    public List<PushSubscriptionDTO> findActiveSubscriptionsByUserId(int userId) {
        return sqlSessionTemplate.selectList("push_mapper.findActiveSubscriptionsByUserId", userId);
    }

    @Override
    public List<PushDispatchTargetDTO> findDispatchTargets(String notificationType) {
        return sqlSessionTemplate.selectList("push_mapper.findDispatchTargets", notificationType);
    }

    @Override
    public int countTodaySuccessForSubscription(Map<String, Object> params) {
        Integer count = sqlSessionTemplate.selectOne("push_mapper.countTodaySuccessForSubscription", params);
        return count == null ? 0 : count;
    }

    @Override
    public Long nextNotificationLogId() {
        Number nextValue = sqlSessionTemplate.selectOne("push_mapper.nextNotificationLogId");
        return nextValue == null ? null : Long.valueOf(nextValue.longValue());
    }

    @Override
    public int insertNotificationLog(NotificationLogDTO notificationLog) {
        return sqlSessionTemplate.insert("push_mapper.insertNotificationLog", notificationLog);
    }

    @Override
    public int markNotificationClicked(long notificationId) {
        return sqlSessionTemplate.update("push_mapper.markNotificationClicked", notificationId);
    }

    @Override
    public int markSubscriptionSuccess(long subscriptionId) {
        return sqlSessionTemplate.update("push_mapper.markSubscriptionSuccess", subscriptionId);
    }

    @Override
    public int markSubscriptionFailure(Map<String, Object> params) {
        return sqlSessionTemplate.update("push_mapper.markSubscriptionFailure", params);
    }
}
