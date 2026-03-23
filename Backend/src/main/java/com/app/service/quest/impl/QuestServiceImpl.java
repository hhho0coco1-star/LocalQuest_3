package com.app.service.quest.impl;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.app.dao.location.LocationDAO;
import com.app.dao.quest.QuestDAO;
import com.app.dao.questlocation.QuestLocationDAO;
import com.app.dto.location.LocationDTO;
import com.app.dto.quest.QuestDTO;
import com.app.dto.quest.QuestDetailDTO;
import com.app.dto.quest.QuestMapDTO;
import com.app.dto.quest.QuestLocationInfoDTO;
import com.app.dto.questlocation.QuestLocationDTO;
import com.app.service.quest.QuestService;

@Service
public class QuestServiceImpl implements QuestService {

    private static final String QUEST_LOCATION_STORAGE_UNAVAILABLE = "QUEST_LOCATION_STORAGE_UNAVAILABLE";

    @Autowired
    private QuestDAO questDAO;

    @Autowired
    private LocationDAO locationDAO;

    @Autowired
    private QuestLocationDAO questLocationDAO;

    private void expireTimedOutQuestsQuietly() {
        try {
            questDAO.updateExpiredQuestsToInactive();
        } catch (Exception e) {
            // DB 준비 전 단계에서도 조회 자체는 최대한 유지한다.
        }
    }

    @Override
    public List<QuestDTO> getAllQuests() {
        expireTimedOutQuestsQuietly();
        return questDAO.selectAllQuests();
    }

    @Override
    public List<String> getQuestCategories() {
        return questDAO.selectQuestCategories();
    }

    @Override
    public List<QuestMapDTO> getQuestMapList() {
        expireTimedOutQuestsQuietly();
        return questDAO.selectQuestMapList();
    }

    @Override
    public QuestDTO getQuestById(int questId) {
        expireTimedOutQuestsQuietly();
        return questDAO.selectQuestById(questId);
    }

    @Override
    public QuestDetailDTO getQuestDetailById(int questId) {
        expireTimedOutQuestsQuietly();
        QuestDTO quest = questDAO.selectQuestById(questId);
        if (quest == null) {
            return null;
        }

        QuestDetailDTO questDetail = new QuestDetailDTO();
        questDetail.setQuestId(quest.getQuestId());
        questDetail.setTitle(quest.getTitle());
        questDetail.setDescription(quest.getDescription());
        questDetail.setCategory(quest.getCategory());
        questDetail.setRewardExp(quest.getRewardExp());
        questDetail.setRewardPoint(quest.getRewardPoint());
        questDetail.setTimeLimit(quest.getTimeLimit());
        questDetail.setStatus(quest.getStatus());
        questDetail.setCreatedAt(quest.getCreatedAt());
        questDetail.setLocations(loadQuestLocationsOrEmpty(questId));

        return questDetail;
    }

    @Override
    @Transactional
    public boolean registerQuest(QuestDTO quest, List<QuestLocationInfoDTO> locations) {
        if (questDAO.insertQuest(quest) != 1) {
            return false;
        }

        replaceQuestLocations(quest.getQuestId(), locations);
        return true;
    }

    @Override
    @Transactional
    public boolean changeQuestStatus(int questId, String status) {
        if ("ACTIVE".equalsIgnoreCase(status)) {
            QuestDTO quest = questDAO.selectQuestById(questId);
            if (quest == null) {
                return false;
            }

            if (normalizeTimeLimit(quest.getTimeLimit()) != null) {
                return questDAO.resetQuestTimerAndActivate(questId) == 1;
            }
        }

        Map<String, Object> params = new HashMap<>();
        params.put("questId", questId);
        params.put("status", status);
        return questDAO.updateQuestStatus(params) == 1;
    }
    
    @Override
    @Transactional
    public boolean updateQuest(QuestDTO quest, List<QuestLocationInfoDTO> locations) {
        QuestDTO currentQuest = questDAO.selectQuestById(quest.getQuestId());
        if (currentQuest == null) {
            return false;
        }

        boolean shouldReactivate = shouldReactivateQuest(currentQuest, quest);

        if (questDAO.updateQuest(quest) <= 0) {
            return false;
        }

        replaceQuestLocations(quest.getQuestId(), locations);

        if (shouldReactivate) {
            questDAO.resetQuestTimerAndActivate(quest.getQuestId());
        }

        return true;
    }

    @Override
    public void expireTimedOutQuests() {
        questDAO.updateExpiredQuestsToInactive();
    }
    
    @Override
    public List<QuestDTO> getSearchQuests(Map<String, Object> params) {
        expireTimedOutQuestsQuietly();
        return questDAO.selectSearchQuests(params);
    }

    private boolean shouldReactivateQuest(QuestDTO currentQuest, QuestDTO updatedQuest) {
        if (!"INACTIVE".equalsIgnoreCase(currentQuest.getStatus())) {
            return false;
        }

        Integer updatedTimeLimit = normalizeTimeLimit(updatedQuest.getTimeLimit());
        if (updatedTimeLimit == null) {
            return false;
        }

        Integer currentTimeLimit = normalizeTimeLimit(currentQuest.getTimeLimit());
        if (currentTimeLimit == null || currentQuest.getCreatedAt() == null) {
            return false;
        }

        long expireAt = currentQuest.getCreatedAt().getTime() + (currentTimeLimit * 60L * 1000L);
        return expireAt <= System.currentTimeMillis();
    }

    private Integer normalizeTimeLimit(Integer timeLimit) {
        if (timeLimit == null || timeLimit <= 0) {
            return null;
        }
        return timeLimit;
    }

    private List<QuestLocationInfoDTO> loadQuestLocationsOrEmpty(int questId) {
        try {
            List<QuestLocationInfoDTO> locations = questDAO.selectQuestLocationsByQuestId(questId);
            return locations == null ? Collections.emptyList() : locations;
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }

    private List<QuestLocationInfoDTO> loadQuestLocationsForWrite(int questId) {
        try {
            List<QuestLocationInfoDTO> locations = questDAO.selectQuestLocationsByQuestId(questId);
            return locations == null ? Collections.emptyList() : locations;
        } catch (Exception e) {
            throw new IllegalStateException(QUEST_LOCATION_STORAGE_UNAVAILABLE, e);
        }
    }

    private void replaceQuestLocations(int questId, List<QuestLocationInfoDTO> locations) {
        List<QuestLocationInfoDTO> existingLocations;
        try {
            existingLocations = loadQuestLocationsForWrite(questId);
        } catch (IllegalStateException e) {
            if (isLocationPayloadEmpty(locations)) {
                return;
            }
            throw e;
        }
        try {
            questLocationDAO.deleteQuestLocationsByQuestId(questId);
        } catch (Exception e) {
            if (isLocationPayloadEmpty(locations)) {
                return;
            }
            throw new IllegalStateException(QUEST_LOCATION_STORAGE_UNAVAILABLE, e);
        }

        if (existingLocations != null && !existingLocations.isEmpty()) {
            List<Integer> oldLocationIds = existingLocations.stream()
                .map(QuestLocationInfoDTO::getLocationId)
                .filter(locationId -> locationId > 0)
                .distinct()
                .collect(Collectors.toList());
            try {
                locationDAO.deleteUnusedLocationsByIds(oldLocationIds);
            } catch (Exception e) {
                if (isLocationPayloadEmpty(locations)) {
                    return;
                }
                throw new IllegalStateException(QUEST_LOCATION_STORAGE_UNAVAILABLE, e);
            }
        }

        if (locations == null || locations.isEmpty()) {
            return;
        }

        int visitOrder = 1;
        for (QuestLocationInfoDTO locationInfo : locations) {
            LocationDTO location = new LocationDTO();
            location.setBusinessId(null);
            location.setName(locationInfo.getName());
            location.setZipCode(locationInfo.getZipCode());
            location.setAddress(locationInfo.getAddress());
            location.setAddressDetail(locationInfo.getAddressDetail());
            location.setLatitude(locationInfo.getLatitude() == null ? 0D : locationInfo.getLatitude());
            location.setLongitude(locationInfo.getLongitude() == null ? 0D : locationInfo.getLongitude());
            location.setLocationType(locationInfo.getLocationType());
            location.setDescription(locationInfo.getDescription());

            try {
                if (locationDAO.saveLocation(location) != 1) {
                    throw new IllegalStateException("Failed to save quest location");
                }
            } catch (IllegalStateException e) {
                throw e;
            } catch (Exception e) {
                throw new IllegalStateException(QUEST_LOCATION_STORAGE_UNAVAILABLE, e);
            }

            QuestLocationDTO questLocation = new QuestLocationDTO();
            questLocation.setQuestId(questId);
            questLocation.setLocationId(location.getLocationId());
            questLocation.setVisitOrder(locationInfo.getVisitOrder() > 0 ? locationInfo.getVisitOrder() : visitOrder);

            try {
                if (questLocationDAO.saveQuestLocation(questLocation) != 1) {
                    throw new IllegalStateException("Failed to save quest location mapping");
                }
            } catch (IllegalStateException e) {
                throw e;
            } catch (Exception e) {
                throw new IllegalStateException(QUEST_LOCATION_STORAGE_UNAVAILABLE, e);
            }

            visitOrder++;
        }
    }

    private boolean isLocationPayloadEmpty(List<QuestLocationInfoDTO> locations) {
        return locations == null || locations.isEmpty();
    }
}
