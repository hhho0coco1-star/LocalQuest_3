package com.app.controller;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Arrays;
import java.util.Collections;
import java.util.Locale;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import com.app.dto.business.BusinessDTO;
import com.app.dto.businessinquiry.BusinessInquiryDTO;
import com.app.dto.location.LocationDTO;
import com.app.dto.quest.QuestDTO;
import com.app.dto.quest.QuestLocationInfoDTO;
import com.app.dto.reward.RewardItemDTO;
import com.app.dto.user.User;
import com.app.service.business.BusinessService;
import com.app.service.businessinquiry.BusinessInquiryService;
import com.app.service.location.LocationService;
import com.app.service.quest.QuestService;
import com.app.service.reward.RewardItemService;
import com.app.service.user.UserService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

@Controller
@RequestMapping("/admin")
public class AdminController {

    private final ObjectMapper objectMapper = new ObjectMapper();
	
	@Autowired
    private UserService userService;
	
	@Autowired
    private QuestService questService;
	
	@Autowired
    private RewardItemService rewardItemService;

	@Autowired
	private LocationService locationService;
	
	@Autowired
	private BusinessService businessService;

	@Autowired
	private BusinessInquiryService businessInquiryService;

	// ê´€ë¦¬ì ë©”ì¸ ?˜ì´ì§€
	@GetMapping("")
	public String admin() {
		return "admin/admin";
	}
	
	// 1. ?Œì› ëª©ë¡ ì¡°íšŒ (?•ë ¬ ë°?ê²€???µí•© ê¶Œì¥)
	@GetMapping("/users")
	public String getUserList(
	        @RequestParam(value="sort", defaultValue="DESC") String sort,
	        @RequestParam(value="type", required=false) String type,
	        @RequestParam(value="keyword", required=false) String keyword,
	        Model model) {
	    
	    // Service?ì„œ ?•ë ¬ê³?ê²€?‰ì„ ?™ì‹œ??ì²˜ë¦¬?˜ë„ë¡??˜ê¹?ˆë‹¤.
	    List<User> userList = userService.searchUsers(type, keyword, sort);
	    model.addAttribute("userList", userList);
	    
	    return "admin/admin-user"; 
	}

	// 2. ?Œì› ê²€??(ê²€?‰ì–´?€ ?•ë ¬ê°’ì„ ?¨ê»˜ ?œë¹„?¤ë¡œ ?„ë‹¬)
	@GetMapping("/search")
	public String searchUsers(
	        @RequestParam("type") String type, 
	        @RequestParam("keyword") String keyword, 
	        @RequestParam(value="sort", defaultValue="DESC") String sort, // ?•ë ¬ ?Œë¼ë¯¸í„° ì¶”ê?
	        Model model) {
	    
	    // [?˜ì • ?µì‹¬] ?´ì œ ?œë¹„??ë©”ì„œ?œëŠ” 3ê°œì˜ ?¸ìë¥?ë°›ìŠµ?ˆë‹¤.
	    List<User> searchList = userService.searchUsers(type, keyword, sort);
	    
	    model.addAttribute("userList", searchList);
	    model.addAttribute("searchType", type);
	    model.addAttribute("keyword", keyword);
	    model.addAttribute("sort", sort);
	    
	    return "admin/admin-user";
	}
    
    // ?Œì›?•ë³´ ?íƒœ ë³€ê²?ê´€ë¦¬ì, ë¹„ë‹ˆì§€?? ?¬ìš©??
    @PostMapping("/users/updateRole")
    @ResponseBody
    public String updateRole(@RequestParam int userId, @RequestParam String role) {
        // 1. ë§ˆìŠ¤??ê´€ë¦¬ì ë³´í˜¸ (ë°±ì—”??ìµœì¢… ë°©ì–´)
        if (userId == 1) {
            return "fail";
        }
        
        try {
            // 2. ?œë¹„???¸ì¶œ ê²°ê³¼ë¥?ë³€?˜ì— ?´ìŠµ?ˆë‹¤.
            boolean isUpdated = userService.changeUserRole(userId, role);
            
            // 3. ?¤ì œ ?…ë°?´íŠ¸ ?±ê³µ ?¬ë????°ë¼ ?‘ë‹µ
            return isUpdated ? "success" : "fail";
        } catch (Exception e) {
            e.printStackTrace(); // ?ëŸ¬ ë¡œê·¸ ?•ì¸??
            return "error";
        }
    }
    
    // ?Œì›?•ë³´ ?íƒœë³€ê²?
    @PostMapping("/users/updateStatus")
    @ResponseBody
    public String updateStatus(@RequestParam int userId, @RequestParam String status) {
        // 1. ë§ˆìŠ¤??ê´€ë¦¬ì ë³´í˜¸ (ë°±ì—”??ìµœì¢… ë°©ì–´)
        if (userId == 1) {
            return "fail";
        }
        
        try {
            // [?˜ì • ?µì‹¬] ?œë¹„?¤ì˜ ?Œë¼ë¯¸í„° ?•ì‹(int, String)??ë§ì¶°???¸ì¶œ?©ë‹ˆ??
            boolean isUpdated = userService.changeUserStatus(userId, status); 
            
            return isUpdated ? "success" : "fail";
        } catch (Exception e) {
            e.printStackTrace();
            return "error";
        }
    }
    
    // ================ Quest ================
    
    /**
     * 1. ?˜ìŠ¤??ê´€ë¦?ë©”ì¸ ?˜ì´ì§€ (?„ì²´ ëª©ë¡ ì¡°íšŒ)
     */
    @GetMapping("/quests")
    public String questList(
        @RequestParam(value="status", required=false) String status,
        @RequestParam(value="keyword", required=false) String keyword,
        Model model) {
        
        // 1. ê²€??ì¡°ê±´??Map???´ê¸°
        String normalizedStatus = (status != null && !status.trim().isEmpty()) ? status.trim() : null;
        String normalizedKeyword = (keyword != null && !keyword.trim().isEmpty()) ? keyword.trim() : null;

        // 2. ?µí•© ?œë¹„???¸ì¶œ 
        // (paramsê°€ ë¹„ì–´?ˆìœ¼ë©?MyBatis ?™ì  ì¿¼ë¦¬ê°€ ?„ì²´ë¥?ì¡°íšŒ?©ë‹ˆ??
        List<QuestDTO> questList;
        String questLoadError = null;
        try {
            List<QuestDTO> allQuests = questService.getAdminQuestList();
            if (allQuests == null || allQuests.isEmpty()) {
                questList = Collections.emptyList();
            } else {
                List<QuestDTO> filteredQuestList = new ArrayList<>();
                String keywordLower = normalizedKeyword == null ? null : normalizedKeyword.toLowerCase(Locale.ROOT);

                for (QuestDTO quest : allQuests) {
                    if (quest == null) {
                        continue;
                    }

                    String questStatus = quest.getStatus();
                    if (questStatus == null || questStatus.trim().isEmpty()) {
                        questStatus = "ACTIVE";
                        quest.setStatus(questStatus);
                    }

                    if (normalizedStatus != null && !normalizedStatus.equalsIgnoreCase(questStatus)) {
                        continue;
                    }

                    if (keywordLower != null) {
                        String questTitle = quest.getTitle() == null ? "" : quest.getTitle();
                        if (!questTitle.toLowerCase(Locale.ROOT).contains(keywordLower)) {
                            continue;
                        }
                    }

                    filteredQuestList.add(quest);
                }

                questList = filteredQuestList;
            }
        } catch (Exception e) {
            e.printStackTrace();
            questList = java.util.Collections.emptyList();
            questLoadError = "?˜ìŠ¤??ëª©ë¡ ì¡°íšŒ ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤.";
        }
        List<String> questCategoryList;
        try {
            questCategoryList = questService.getQuestCategories();
            if (questCategoryList == null || questCategoryList.isEmpty()) {
                questCategoryList = Arrays.asList("DAILY", "MAIN", "SUB", "EVENT");
            }
        } catch (Exception e) {
            questCategoryList = Arrays.asList("DAILY", "MAIN", "SUB", "EVENT");
        }
        
        model.addAttribute("questList", questList);
        model.addAttribute("questCategoryList", questCategoryList);
        model.addAttribute("questLoadError", questLoadError);
        
        // 3. ê²€??ì¡°ê±´ ? ì? (?”ë©´ input/select ë°•ìŠ¤ ?íƒœ ? ì???
        model.addAttribute("currentStatus", normalizedStatus);
        model.addAttribute("currentKeyword", normalizedKeyword);
        
        return "admin/admin-quest";
    }
    /**
     * 2. ?˜ìŠ¤???íƒœ ë³€ê²?(ë¹„ë™ê¸?ì²˜ë¦¬)
     * @param questId ë³€ê²½í•  ?˜ìŠ¤??ë²ˆí˜¸
     * @param status ë³€ê²½í•  ?íƒœ ('ACTIVE', 'INACTIVE', 'DELETED')
     */
    @PostMapping("/quests/updateStatus")
    @ResponseBody
    public String updateQuestStatus(@RequestParam int questId, @RequestParam String status) {
        try {
            boolean isUpdated = questService.changeQuestStatus(questId, status);
            return isUpdated ? "success" : "fail";
        } catch (Exception e) {
            e.printStackTrace();
            return "error";
        }
    }

    // 3. ?˜ìŠ¤???±ë¡ (ê´€ë¦¬ì??
    @GetMapping("/locations/search")
    @ResponseBody
    public List<Map<String, Object>> searchLocations(
        @RequestParam(value = "keyword", required = false) String keyword) {
        try {
            List<LocationDTO> locations = locationService.searchLocations(keyword);
            List<Map<String, Object>> response = new java.util.ArrayList<>();

            for (LocationDTO location : locations) {
                if (location == null) {
                    continue;
                }

                Map<String, Object> item = new LinkedHashMap<>();
                item.put("locationId", location.getLocationId());
                item.put("businessId", location.getBusinessId());
                item.put("name", location.getName());
                item.put("zipCode", location.getZipCode());
                item.put("address", location.getAddress());
                item.put("addressDetail", location.getAddressDetail());
                item.put("latitude", location.getLatitude());
                item.put("longitude", location.getLongitude());
                item.put("locationType", location.getLocationType());
                item.put("description", location.getDescription());
                response.add(item);
            }

            return response;
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }

    @PostMapping("/quests/register")
    @ResponseBody
    public String registerQuest(
        QuestDTO quest,
        @RequestParam(value = "locationsJson", required = false) String locationsJson) { 
        try {
            // ?°ì´?°ê? ???˜ì–´?¤ëŠ”ì§€ ?œë²„ ì½˜ì†”?ì„œ ?•ì¸ (?”ë²„ê¹…ìš©)
            System.out.println(">>> ?˜ìŠ¤???±ë¡ ?”ì²­ ?°ì´?? " + quest);
            
            // ?„ìˆ˜ê°’ì´ ë¹„ì–´?ˆëŠ”ì§€ ê°„ë‹¨ ì²´í¬ (?œë²„ ì¸?ê²€ì¦?
            if (quest.getTitle() == null || quest.getTitle().trim().isEmpty()) {
                return "fail:title_empty";
            }
            if (quest.getCategory() == null || quest.getCategory().trim().isEmpty()) {
                return "fail:category_empty";
            }
            if (quest.getDescription() == null || quest.getDescription().trim().isEmpty()) {
                return "fail:description_empty";
            }
            List<String> questCategoryList = null;
            try {
                questCategoryList = questService.getQuestCategories();
            } catch (Exception e) {
                return "fail:category_table_missing";
            }
            if (questCategoryList == null || questCategoryList.isEmpty()) {
                return "fail:category_not_ready";
            }
            if (!questCategoryList.contains(quest.getCategory())) {
                return "fail:category_invalid";
            }

            List<QuestLocationInfoDTO> locations = parseQuestLocations(locationsJson);
            if (locations == null) {
                return "fail:locations_invalid";
            }
            String locationValidationResult = validateQuestLocations(locations);
            if (locationValidationResult != null) {
                return locationValidationResult;
            }

            boolean isRegistered = questService.registerQuest(quest, locations);
            
            // ?±ê³µ ??ë°˜ë“œ??"success"ë§?ë°˜í™˜?˜ë„ë¡?ë³´ì¥
            return isRegistered ? "success" : "fail";
            
        } catch (Exception e) {
            System.err.println("!!! ?˜ìŠ¤???±ë¡ ì¤??ëŸ¬ ë°œìƒ !!!");
            
            e.printStackTrace();
            if (isQuestLocationStorageUnavailable(e)) {
                return "fail:location_tables_missing";
            }
            if (isQuestLocationReferenceMissing(e)) {
                return "fail:location_reference_missing";
            }
            if (isQuestLocationConstraintConflict(e)) {
                return "fail:location_conflict";
            }
            return "error";
        }
    }
    
    /**
     * ?˜ìŠ¤???•ë³´ ?˜ì • ì²˜ë¦¬ (Ajax)
     */
    @PostMapping("/quests/update")
    @ResponseBody // Ajax ?”ì²­???€??ë¬¸ì???°ì´?°ë? ì§ì ‘ ë°˜í™˜?˜ê¸° ?„í•´ ?„ìˆ˜!
    public String updateQuest(
        QuestDTO quest,
        @RequestParam(value = "locationsJson", required = false) String locationsJson) {
        try {
            // 1. ?˜ì–´???°ì´??ë¡œê·¸ ?•ì¸ (?”ë²„ê¹…ìš©)
            System.out.println(">>> ?˜ìŠ¤???˜ì • ?”ì²­ ?°ì´?? " + quest);

            // 2. ?œë¹„???¸ì¶œ (?±ê³µ ??true ë°˜í™˜)
            if (quest.getQuestId() <= 0) {
                return "fail:invalid_id";
            }
            if (quest.getTitle() == null || quest.getTitle().trim().isEmpty()) {
                return "fail:title_empty";
            }
            if (quest.getCategory() == null || quest.getCategory().trim().isEmpty()) {
                return "fail:category_empty";
            }
            if (quest.getDescription() == null || quest.getDescription().trim().isEmpty()) {
                return "fail:description_empty";
            }
            List<String> questCategoryList = null;
            try {
                questCategoryList = questService.getQuestCategories();
            } catch (Exception e) {
                return "fail:category_table_missing";
            }
            if (questCategoryList == null || questCategoryList.isEmpty()) {
                return "fail:category_not_ready";
            }
            if (!questCategoryList.contains(quest.getCategory())) {
                return "fail:category_invalid";
            }

            List<QuestLocationInfoDTO> locations = parseQuestLocations(locationsJson);
            if (locations == null) {
                return "fail:locations_invalid";
            }
            String locationValidationResult = validateQuestLocations(locations);
            if (locationValidationResult != null) {
                return locationValidationResult;
            }

            boolean isUpdated = questService.updateQuest(quest, locations);

            // 3. ê²°ê³¼ ë°˜í™˜ (JS??res.trim() === "success"?€ ë§¤ì¹­)
            return isUpdated ? "success" : "fail";

        } catch (Exception e) {
            // ?ëŸ¬ ë°œìƒ ??ì½˜ì†”??ì¶œë ¥?˜ê³  error ë°˜í™˜
            System.err.println("!!! ?˜ìŠ¤???˜ì • ì¤??œë²„ ?ëŸ¬ ë°œìƒ !!!");
            e.printStackTrace();
            if (isQuestLocationStorageUnavailable(e)) {
                return "fail:location_tables_missing";
            }
            if (isQuestLocationReferenceMissing(e)) {
                return "fail:location_reference_missing";
            }
            if (isQuestLocationConstraintConflict(e)) {
                return "fail:location_conflict";
            }
            return "error";
        }
    }

    private List<QuestLocationInfoDTO> parseQuestLocations(String locationsJson) {
        if (locationsJson == null || locationsJson.trim().isEmpty()) {
            return Collections.emptyList();
        }

        try {
            return objectMapper.readValue(
                locationsJson,
                new TypeReference<List<QuestLocationInfoDTO>>() {}
            );
        } catch (Exception e) {
            return null;
        }
    }

    private String validateQuestLocations(List<QuestLocationInfoDTO> locations) {
        if (locations == null) {
            return "fail:locations_invalid";
        }

        for (QuestLocationInfoDTO location : locations) {
            if (location == null) {
                return "fail:locations_invalid";
            }
            if (location.getName() == null || location.getName().trim().isEmpty()) {
                return "fail:location_name_empty";
            }
            if (location.getAddress() == null || location.getAddress().trim().isEmpty()) {
                return "fail:location_address_empty";
            }
            if (location.getLatitude() == null || location.getLongitude() == null) {
                return "fail:location_coordinate_empty";
            }
        }

        return null;
    }

    private boolean isQuestLocationStorageUnavailable(Throwable throwable) {
        return containsMessage(
            throwable,
            "ORA-00942",
            "ORA-02289",
            "SEQ_LQ_QUEST_LOCATION_PK",
            "SEQ_LQ_LOCATION_PK",
            "TABLE OR VIEW DOES NOT EXIST"
        );
    }

    private boolean isQuestLocationReferenceMissing(Throwable throwable) {
        return containsMessage(
            throwable,
            "ORA-02291",
            "FK_LQ_QUEST_LOCATION_LOCATION",
            "FK_LQ_QUEST_LOCATION_QUEST"
        );
    }

    private boolean isQuestLocationConstraintConflict(Throwable throwable) {
        return containsMessage(
            throwable,
            "UQ_LQ_QUEST_LOCATION_QUEST_LOC",
            "UQ_LQ_QUEST_LOCATION_ORDER"
        );
    }

    private boolean containsMessage(Throwable throwable, String... candidates) {
        Throwable current = throwable;
        while (current != null) {
            String message = current.getMessage();
            if (message != null) {
                String upperMessage = message.toUpperCase(Locale.ROOT);
                for (String candidate : candidates) {
                    if (upperMessage.contains(candidate)) {
                        return true;
                    }
                }
            }
            current = current.getCause();
        }
        return false;
    }
    
    // ================ Reward_Item ================
    
    /**
     * 1. ë¦¬ì›Œ???„ì´??ëª©ë¡ ì¡°íšŒ (ê²€??ë°??„í„° ?µí•©)
     * URL: /admin/shop
     */
    @GetMapping("/shop")
    public String itemList(
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "keyword", required = false) String keyword,
            Model model) {

        Map<String, Object> params = new HashMap<>();
        params.put("status", (status != null && !status.isEmpty()) ? status : null);
        params.put("keyword", (keyword != null && !keyword.isEmpty()) ? keyword : null);

        // ?œë¹„???¸ì¶œ
        List<RewardItemDTO> itemList = rewardItemService.getSearchItems(params);
        model.addAttribute("itemList", itemList);
        
        // ?„í„° ?íƒœ ? ì???
        model.addAttribute("currentStatus", status);
        model.addAttribute("currentKeyword", keyword);

        return "admin/admin-reward-item"; // admin-shop.jsp ë¡??´ë™
    }

    /**
     * 2. ?„ì´???±ë¡ ë°??˜ì • ì²˜ë¦¬ (Ajax)
     * URL: /admin/shop/save
     */
    @PostMapping("/shop/save")
    @ResponseBody
    public String saveItem(RewardItemDTO item) {
        try {
            boolean result;
            // PK??rewardItemIdê°€ 0?´ë©´ ?±ë¡, ?„ë‹ˆë©??˜ì •
            if (item.getRewardItemId() == 0) {
                result = rewardItemService.registerItem(item);
            } else {
                result = rewardItemService.modifyItem(item);
            }
            return result ? "success" : "fail";
        } catch (Exception e) {
            System.err.println("!!! ?ì  ?„ì´???€??ì¤??ëŸ¬ ë°œìƒ !!!");
            e.printStackTrace();
            return "error";
        }
    }

    /**
     * 3. ?„ì´???íƒœ ë³€ê²?(?ë§¤ì¤? ?ˆì ˆ, ?¨ê?, ?? œ ??Ajax)
     * URL: /admin/shop/updateStatus
     */
    @PostMapping("/shop/updateStatus")
    @ResponseBody
    public String updateItemStatus(@RequestParam int itemId, @RequestParam String status) {
        try {
            boolean isUpdated = rewardItemService.changeItemStatus(itemId, status);
            return isUpdated ? "success" : "fail";
        } catch (Exception e) {
            e.printStackTrace();
            return "error";
        }
    }
    
    // ================ Business ================
    
    /**
     * 1. ë¹„ì¦ˆ?ˆìŠ¤ ëª©ë¡ ì¡°íšŒ ë°?ê´€ë¦¬ì ?˜ì´ì§€ ì§„ì…
     */
    @GetMapping("/store-info")
    public String businessList(
            @RequestParam(value = "tab", defaultValue = "inquiry") String tab,
            @RequestParam(value = "businessKeyword", required = false) String businessKeyword,
            @RequestParam(value = "inquiryKeyword", required = false) String inquiryKeyword,
            @RequestParam(value = "inquiryStatus", required = false) String inquiryStatus,
            @RequestParam(value = "userId", required = false) Integer userId,
            Model model) {

        Map<String, Object> businessParams = new HashMap<>();
        businessParams.put("keyword", (businessKeyword != null && !businessKeyword.isEmpty()) ? businessKeyword : null);
        businessParams.put("userId", userId);

        Map<String, Object> inquiryParams = new HashMap<>();
        inquiryParams.put("keyword", (inquiryKeyword != null && !inquiryKeyword.isEmpty()) ? inquiryKeyword : null);
        inquiryParams.put("status", (inquiryStatus != null && !inquiryStatus.isEmpty()) ? inquiryStatus : null);
        inquiryParams.put("userId", userId);

        List<BusinessDTO> businessList = null;
        List<BusinessInquiryDTO> businessInquiryList = null;
        String businessError = null;
        String businessInquiryError = null;

        try {
            businessList = businessService.getBusinessList(businessParams);
        } catch (Exception e) {
            businessError = e.getClass().getSimpleName() + ": " + e.getMessage();
            e.printStackTrace();
        }

        try {
            businessInquiryList = businessInquiryService.getBusinessInquiryList(inquiryParams);
        } catch (Exception e) {
            businessInquiryError = e.getClass().getSimpleName() + ": " + e.getMessage();
            e.printStackTrace();
        }

        model.addAttribute("currentTab", tab);
        model.addAttribute("businessList", businessList);
        model.addAttribute("businessInquiryList", businessInquiryList);
        model.addAttribute("currentBusinessKeyword", businessKeyword);
        model.addAttribute("currentInquiryKeyword", inquiryKeyword);
        model.addAttribute("currentInquiryStatus", inquiryStatus);
        model.addAttribute("currentUserId", userId);

        return "admin/admin-business";
    }

    /**
     * 2. ë¹„ì¦ˆ?ˆìŠ¤ ?ì„¸ ì¡°íšŒ (Ajax)
     */
    @GetMapping("/store-info/detail")
    @ResponseBody
    public Map<String, Object> getBusinessDetail(@RequestParam int businessId) {
        BusinessDTO business = businessService.getBusinessById(businessId);

        if (business == null) {
            return null;
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("businessId", business.getBusinessId());
        result.put("userId", business.getUserId());
        result.put("businessName", business.getBusinessName());
        result.put("zipCode", business.getZipCode());
        result.put("address", business.getAddress());
        result.put("addressDetail", business.getAddressDetail());
        result.put("phone", business.getPhone());
        result.put("description", business.getDescription());
        result.put("createdAt", business.getCreatedAt() != null ? business.getCreatedAt().toString() : null);

        return result;
    }

    @GetMapping("/store-info/inquiry/detail")
    @ResponseBody
    public Map<String, Object> getBusinessInquiryDetail(@RequestParam int inquiryId) {
        BusinessInquiryDTO inquiry = businessInquiryService.getBusinessInquiryById(inquiryId);

        if (inquiry == null) {
            return null;
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("inquiryId", inquiry.getInquiryId());
        result.put("userId", inquiry.getUserId());
        result.put("title", inquiry.getTitle());
        result.put("content", inquiry.getContent());
        result.put("status", inquiry.getStatus());
        result.put("zipCode", inquiry.getZipCode());
        result.put("address", inquiry.getAddress());
        result.put("addressDetail", inquiry.getAddressDetail());
        result.put("phone", inquiry.getPhone());
        result.put("createdAt", inquiry.getCreatedAt() != null ? inquiry.getCreatedAt().toString() : null);
        return result;
    }

    /**
     * 3. ë¹„ì¦ˆ?ˆìŠ¤ ?±ë¡/?˜ì • ì²˜ë¦¬ (Ajax)
     */
    @PostMapping("/store-info/save")
    @ResponseBody
    public String saveBusiness(
            BusinessDTO business,
            @RequestParam(value = "inquiryId", required = false) Integer inquiryId) {
        try {
            if (business.getBusinessName() == null || business.getBusinessName().trim().isEmpty()) {
                return "fail:business_name_empty";
            }
            if (business.getZipCode() == null || business.getZipCode().trim().isEmpty()) {
                return "fail:zip_code_empty";
            }
            if (business.getAddress() == null || business.getAddress().trim().isEmpty()) {
                return "fail:address_empty";
            }
            if (business.getUserId() <= 0) {
                return "fail:user_id_invalid";
            }

            boolean result;
            if (business.getBusinessId() == 0) {
                result = businessService.registerBusiness(business);
                if (result && inquiryId != null && inquiryId > 0) {
                    businessInquiryService.updateBusinessInquiryStatus(inquiryId, "ANSWERED");
                }
            } else {
                result = businessService.updateBusiness(business);
            }

            return result ? "success" : "fail";
        } catch (Exception e) {
            System.err.println("!!! ë¹„ì¦ˆ?ˆìŠ¤ ?€??ì¤??ëŸ¬ ë°œìƒ !!!");
            e.printStackTrace();
            return "error";
        }
    }

    @PostMapping("/store-info/inquiry/updateStatus")
    @ResponseBody
    public String updateBusinessInquiryStatus(@RequestParam int inquiryId, @RequestParam String status) {
        try {
            boolean isUpdated = businessInquiryService.updateBusinessInquiryStatus(inquiryId, status);
            return isUpdated ? "success" : "fail";
        } catch (Exception e) {
            e.printStackTrace();
            return "error";
        }
    }

    @PostMapping("/store-info/inquiry/delete")
    @ResponseBody
    public String deleteBusinessInquiry(@RequestParam int inquiryId) {
        try {
            boolean isDeleted = businessInquiryService.deleteBusinessInquiry(inquiryId);
            return isDeleted ? "success" : "fail";
        } catch (Exception e) {
            e.printStackTrace();
            return "error";
        }
    }

    /**
     * 4. ë¹„ì¦ˆ?ˆìŠ¤ ?? œ ì²˜ë¦¬ (Ajax)
     */
    @PostMapping("/store-info/delete")
    @ResponseBody
    public String deleteBusiness(@RequestParam int businessId) {
        try {
            BusinessDTO business = businessService.getBusinessById(businessId);
            if (business == null) {
                return "fail";
            }

            boolean isDeleted = businessService.deleteBusiness(businessId);
            if (isDeleted) {
                Map<String, Object> inquiryParams = new HashMap<>();
                inquiryParams.put("userId", business.getUserId());
                inquiryParams.put("status", "ANSWERED");

                List<BusinessInquiryDTO> inquiryList = businessInquiryService.getBusinessInquiryList(inquiryParams);
                if (inquiryList != null && !inquiryList.isEmpty()) {
                    businessInquiryService.updateBusinessInquiryStatus(inquiryList.get(0).getInquiryId(), "IN_PROGRESS");
                }
            }
            return isDeleted ? "success" : "fail";
        } catch (Exception e) {
            System.err.println("!!! ë¹„ì¦ˆ?ˆìŠ¤ ?? œ ì¤??ëŸ¬ ë°œìƒ !!!");
            e.printStackTrace();
            return "error";
        }
    }
    
}


