package com.app.service.quest.impl;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

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
import com.app.dto.quest.QuestTopRatedDTO;
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

    @Override
    public List<QuestDTO> getAdminQuestList() {
        return questDAO.selectAdminAllQuests();
    }

    @Override
    public List<QuestDTO> getAllQuests() {
        return questDAO.selectAllQuests();
    }

    @Override
    public List<QuestMapDTO> getQuestMapList() {
        return questDAO.selectQuestMapList();
    }

    @Override
    public List<QuestTopRatedDTO> getTopRatedQuests(int limit) {
        return questDAO.selectTopRatedQuests(limit);
    }

    @Override
    public QuestDTO getQuestById(int questId) {
        return questDAO.selectQuestById(questId);
    }

    @Override
    public QuestDetailDTO getQuestDetailById(int questId) {
        QuestDTO quest = questDAO.selectQuestById(questId);
        if (quest == null) {
            return null;
        }

        QuestDetailDTO questDetail = new QuestDetailDTO();
        questDetail.setQuestId(quest.getQuestId());
        questDetail.setTitle(quest.getTitle());
        questDetail.setDescription(quest.getDescription());
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
        Map<String, Object> params = new HashMap<>();
        params.put("questId", questId);
        params.put("status", status);
        return questDAO.updateQuestStatus(params) == 1;
    }
    
    @Override
    @Transactional
    public boolean updateQuest(QuestDTO quest, List<QuestLocationInfoDTO> locations) {
        if (questDAO.selectQuestById(quest.getQuestId()) == null) {
            return false;
        }

        if (questDAO.updateQuest(quest) <= 0) {
            return false;
        }

        replaceQuestLocations(quest.getQuestId(), locations);

        return true;
    }

    @Override
    public void expireTimedOutQuests() {
        // 전역 퀘스트 제한시간 만료는 더 이상 사용하지 않는다.
    }
    
    @Override
    public List<QuestDTO> getSearchQuests(Map<String, Object> params) {
        return questDAO.selectSearchQuests(params);
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

        if (locations == null || locations.isEmpty()) {
            return;
        }

        int visitOrder = 1;
        for (QuestLocationInfoDTO locationInfo : locations) {
            int locationId = locationInfo.getLocationId();
            if (locationId <= 0) {
                LocationDTO location = new LocationDTO();
                location.setBusinessId(null);
                location.setName(locationInfo.getName());
                location.setZipCode(locationInfo.getZipCode());
                location.setAddress(locationInfo.getAddress());
                location.setAddressDetail(locationInfo.getAddressDetail());
                location.setLatitude(locationInfo.getLatitude() == null ? 0D : locationInfo.getLatitude());
                location.setLongitude(locationInfo.getLongitude() == null ? 0D : locationInfo.getLongitude());
                location.setLocationType(locationInfo.getLocationType());
                location.setLocationCategory(locationInfo.getLocationCategory());
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

                locationId = location.getLocationId();
            }

            QuestLocationDTO questLocation = new QuestLocationDTO();
            questLocation.setQuestId(questId);
            questLocation.setLocationId(locationId);
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
