package com.app.controller;

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
import com.app.dto.quest.QuestDTO;
import com.app.dto.quest.QuestLocationInfoDTO;
import com.app.dto.reward.RewardItemDTO;
import com.app.dto.user.User;
import com.app.service.business.BusinessService;
import com.app.service.businessinquiry.BusinessInquiryService;
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
	private BusinessService businessService;

	@Autowired
	private BusinessInquiryService businessInquiryService;

	// 관리자 메인 페이지
	@GetMapping("")
	public String admin() {
		return "admin/admin";
	}
	
	// 1. 회원 목록 조회 (정렬 및 검색 통합 권장)
	@GetMapping("/users")
	public String getUserList(
	        @RequestParam(value="sort", defaultValue="DESC") String sort,
	        @RequestParam(value="type", required=false) String type,
	        @RequestParam(value="keyword", required=false) String keyword,
	        Model model) {
	    
	    // Service에서 정렬과 검색을 동시에 처리하도록 넘깁니다.
	    List<User> userList = userService.searchUsers(type, keyword, sort);
	    model.addAttribute("userList", userList);
	    
	    return "admin/admin-user"; 
	}

	// 2. 회원 검색 (검색어와 정렬값을 함께 서비스로 전달)
	@GetMapping("/search")
	public String searchUsers(
	        @RequestParam("type") String type, 
	        @RequestParam("keyword") String keyword, 
	        @RequestParam(value="sort", defaultValue="DESC") String sort, // 정렬 파라미터 추가
	        Model model) {
	    
	    // [수정 핵심] 이제 서비스 메서드는 3개의 인자를 받습니다.
	    List<User> searchList = userService.searchUsers(type, keyword, sort);
	    
	    model.addAttribute("userList", searchList);
	    model.addAttribute("searchType", type);
	    model.addAttribute("keyword", keyword);
	    model.addAttribute("sort", sort);
	    
	    return "admin/admin-user";
	}
    
    // 회원정보 상태 변경(관리자, 비니지스, 사용자)
    @PostMapping("/users/updateRole")
    @ResponseBody
    public String updateRole(@RequestParam int userId, @RequestParam String role) {
        // 1. 마스터 관리자 보호 (백엔드 최종 방어)
        if (userId == 1) {
            return "fail";
        }
        
        try {
            // 2. 서비스 호출 결과를 변수에 담습니다.
            boolean isUpdated = userService.changeUserRole(userId, role);
            
            // 3. 실제 업데이트 성공 여부에 따라 응답
            return isUpdated ? "success" : "fail";
        } catch (Exception e) {
            e.printStackTrace(); // 에러 로그 확인용
            return "error";
        }
    }
    
    // 회원정보 상태변경
    @PostMapping("/users/updateStatus")
    @ResponseBody
    public String updateStatus(@RequestParam int userId, @RequestParam String status) {
        // 1. 마스터 관리자 보호 (백엔드 최종 방어)
        if (userId == 1) {
            return "fail";
        }
        
        try {
            // [수정 핵심] 서비스의 파라미터 형식(int, String)에 맞춰서 호출합니다.
            boolean isUpdated = userService.changeUserStatus(userId, status); 
            
            return isUpdated ? "success" : "fail";
        } catch (Exception e) {
            e.printStackTrace();
            return "error";
        }
    }
    
    // ================ Quest ================
    
    /**
     * 1. 퀘스트 관리 메인 페이지 (전체 목록 조회)
     */
    @GetMapping("/quests")
    public String questList(
        @RequestParam(value="status", required=false) String status,
        @RequestParam(value="keyword", required=false) String keyword,
        Model model) {
        
        // 1. 검색 조건을 Map에 담기
        Map<String, Object> params = new HashMap<>();
        params.put("status", (status != null && !status.isEmpty()) ? status : null);
        params.put("keyword", (keyword != null && !keyword.isEmpty()) ? keyword : null);

        try {
            questService.expireTimedOutQuests();
        } catch (Exception e) {
            // 만료 처리 실패가 나더라도 목록 화면은 최대한 유지한다.
        }
        
        // 2. 통합 서비스 호출 
        // (params가 비어있으면 MyBatis 동적 쿼리가 전체를 조회합니다)
        List<QuestDTO> questList;
        try {
            questList = questService.getSearchQuests(params);
        } catch (Exception e) {
            questList = java.util.Collections.emptyList();
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
        
        // 3. 검색 조건 유지 (화면 input/select 박스 상태 유지용)
        model.addAttribute("currentStatus", status);
        model.addAttribute("currentKeyword", keyword);
        
        return "admin/admin-quest";
    }
    /**
     * 2. 퀘스트 상태 변경 (비동기 처리)
     * @param questId 변경할 퀘스트 번호
     * @param status 변경할 상태 ('ACTIVE', 'INACTIVE', 'DELETED')
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

    // 3. 퀘스트 등록 (관리자용)
    @PostMapping("/quests/register")
    @ResponseBody
    public String registerQuest(
        QuestDTO quest,
        @RequestParam(value = "locationsJson", required = false) String locationsJson) { 
        try {
            // 데이터가 잘 넘어오는지 서버 콘솔에서 확인 (디버깅용)
            System.out.println(">>> 퀘스트 등록 요청 데이터: " + quest);
            
            // 필수값이 비어있는지 간단 체크 (서버 측 검증)
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
            
            // 성공 시 반드시 "success"만 반환하도록 보장
            return isRegistered ? "success" : "fail";
            
        } catch (Exception e) {
            System.err.println("!!! 퀘스트 등록 중 에러 발생 !!!");
            e.printStackTrace();
            return "error";
        }
    }
    
    /**
     * 퀘스트 정보 수정 처리 (Ajax)
     */
    @PostMapping("/quests/update")
    @ResponseBody // Ajax 요청에 대해 문자열 데이터를 직접 반환하기 위해 필수!
    public String updateQuest(
        QuestDTO quest,
        @RequestParam(value = "locationsJson", required = false) String locationsJson) {
        try {
            // 1. 넘어온 데이터 로그 확인 (디버깅용)
            System.out.println(">>> 퀘스트 수정 요청 데이터: " + quest);

            // 2. 서비스 호출 (성공 시 true 반환)
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

            // 3. 결과 반환 (JS의 res.trim() === "success"와 매칭)
            return isUpdated ? "success" : "fail";

        } catch (Exception e) {
            // 에러 발생 시 콘솔에 출력하고 error 반환
            System.err.println("!!! 퀘스트 수정 중 서버 에러 발생 !!!");
            e.printStackTrace();
            if (isQuestLocationStorageUnavailable(e)) {
                return "fail:location_tables_missing";
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
        Throwable current = throwable;
        while (current != null) {
            String message = current.getMessage();
            if (message != null) {
                String upperMessage = message.toUpperCase(Locale.ROOT);
                if (upperMessage.contains("QUEST_LOCATION_STORAGE_UNAVAILABLE")
                    || upperMessage.contains("LQ_QUEST_LOCATION")
                    || upperMessage.contains("LQ_LOCATION")
                    || upperMessage.contains("ORA-00942")) {
                    return true;
                }
            }
            current = current.getCause();
        }
        return false;
    }
    
    // ================ Reward_Item ================
    
    /**
     * 1. 리워드 아이템 목록 조회 (검색 및 필터 통합)
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

        // 서비스 호출
        List<RewardItemDTO> itemList = rewardItemService.getSearchItems(params);
        model.addAttribute("itemList", itemList);
        
        // 필터 상태 유지용
        model.addAttribute("currentStatus", status);
        model.addAttribute("currentKeyword", keyword);

        return "admin/admin-reward-item"; // admin-shop.jsp 로 이동
    }

    /**
     * 2. 아이템 등록 및 수정 처리 (Ajax)
     * URL: /admin/shop/save
     */
    @PostMapping("/shop/save")
    @ResponseBody
    public String saveItem(RewardItemDTO item) {
        try {
            boolean result;
            // PK인 rewardItemId가 0이면 등록, 아니면 수정
            if (item.getRewardItemId() == 0) {
                result = rewardItemService.registerItem(item);
            } else {
                result = rewardItemService.modifyItem(item);
            }
            return result ? "success" : "fail";
        } catch (Exception e) {
            System.err.println("!!! 상점 아이템 저장 중 에러 발생 !!!");
            e.printStackTrace();
            return "error";
        }
    }

    /**
     * 3. 아이템 상태 변경 (판매중, 품절, 숨김, 삭제 등 Ajax)
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
     * 1. 비즈니스 목록 조회 및 관리자 페이지 진입
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
     * 2. 비즈니스 상세 조회 (Ajax)
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
     * 3. 비즈니스 등록/수정 처리 (Ajax)
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
            System.err.println("!!! 비즈니스 저장 중 에러 발생 !!!");
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
     * 4. 비즈니스 삭제 처리 (Ajax)
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
            System.err.println("!!! 비즈니스 삭제 중 에러 발생 !!!");
            e.printStackTrace();
            return "error";
        }
    }
    
}
