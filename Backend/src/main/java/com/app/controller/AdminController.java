package com.app.controller;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Collections;
import java.util.Locale;
import java.util.NoSuchElementException;

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
import com.app.dto.faq.FaqDTO;
import com.app.dto.inquiry.InquiryDTO;
import com.app.dto.inquiry.InquiryStatus;
import com.app.dto.location.LocationDTO;
import com.app.dto.locationqr.BusinessQrInfoDTO;
import com.app.dto.notice.NoticeDTO;
import com.app.dto.quest.QuestDTO;
import com.app.dto.quest.QuestLocationInfoDTO;
import com.app.dto.reward.RewardItemDTO;
import com.app.dto.user.User;
import com.app.service.business.BusinessService;
import com.app.service.businessinquiry.BusinessInquiryService;
import com.app.service.faq.FaqService;
import com.app.service.inquiry.InquiryService;
import com.app.service.location.LocationService;
import com.app.service.locationqr.LocationQrService;
import com.app.service.notice.NoticeService;
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

	@Autowired
	private InquiryService inquiryService;

	@Autowired
	private LocationQrService locationQrService;

	@Autowired
	private NoticeService noticeService;

	@Autowired
	private FaqService faqService;

	// 관리자 메인 페이지
	@GetMapping("")
	public String admin() {
		return "admin/admin";
	}
	
	// 1. 회원 목록 조회
	@GetMapping("/notice")
	public String noticeAdmin(
	        @RequestParam(value = "keyword", required = false) String keyword,
	        @RequestParam(value = "pinned", required = false) Integer pinned,
	        Model model) {
	    String normalizedKeyword = (keyword != null && !keyword.trim().isEmpty()) ? keyword.trim() : null;
	    Integer normalizedPinned = (pinned != null && (pinned == 0 || pinned == 1)) ? pinned : null;
	    List<NoticeDTO> noticeList = Collections.emptyList();
	    String noticeLoadError = null;

	    try {
	        List<NoticeDTO> allNoticeList = noticeService.findNoticeList();
	        if (allNoticeList == null || allNoticeList.isEmpty()) {
	            noticeList = Collections.emptyList();
	        } else {
	            List<NoticeDTO> filteredNoticeList = new ArrayList<>();
	            String keywordLower = normalizedKeyword == null ? null : normalizedKeyword.toLowerCase(Locale.ROOT);

	            for (NoticeDTO notice : allNoticeList) {
	                if (notice == null) {
	                    continue;
	                }

	                if (normalizedPinned != null && notice.getIsPinned() != normalizedPinned.intValue()) {
	                    continue;
	                }

	                if (keywordLower != null) {
	                    String title = notice.getTitle() == null ? "" : notice.getTitle();
	                    String content = notice.getContent() == null ? "" : notice.getContent();
	                    boolean matched = title.toLowerCase(Locale.ROOT).contains(keywordLower)
	                        || content.toLowerCase(Locale.ROOT).contains(keywordLower);

	                    if (!matched) {
	                        continue;
	                    }
	                }

	                filteredNoticeList.add(notice);
	            }

	            noticeList = filteredNoticeList;
	        }
	    } catch (Exception e) {
	        noticeLoadError = e.getClass().getSimpleName() + ": " + e.getMessage();
	        e.printStackTrace();
	    }

	    model.addAttribute("noticeList", noticeList);
	    model.addAttribute("noticeLoadError", noticeLoadError);
	    model.addAttribute("currentKeyword", normalizedKeyword);
	    model.addAttribute("currentPinned", normalizedPinned);
	    return "admin/admin-notice";
	}

	@GetMapping("/notice/detail")
	@ResponseBody
	public Map<String, Object> getNoticeDetailForAdmin(@RequestParam int noticeId) {
	    NoticeDTO notice = noticeService.findNoticeById(noticeId);

	    if (notice == null) {
	        return null;
	    }

	    Map<String, Object> result = new LinkedHashMap<>();
	    result.put("noticeId", notice.getNoticeId());
	    result.put("title", notice.getTitle());
	    result.put("content", notice.getContent());
	    result.put("viewCount", notice.getViewCount());
	    result.put("isPinned", notice.getIsPinned());
	    result.put("createdAt", notice.getCreatedAt() != null ? notice.getCreatedAt().toString() : null);
	    return result;
	}

	@GetMapping("/faq")
	public String faqAdmin(
	        @RequestParam(value = "keyword", required = false) String keyword,
	        @RequestParam(value = "category", required = false) String category,
	        Model model) {
	    String normalizedKeyword = (keyword != null && !keyword.trim().isEmpty()) ? keyword.trim() : null;
	    String normalizedCategory = (category != null && !category.trim().isEmpty()) ? category.trim() : null;
	    List<FaqDTO> faqList = Collections.emptyList();
	    List<String> faqCategoryOptions = new ArrayList<>();
	    String faqLoadError = null;

	    try {
	        List<FaqDTO> allFaqList = faqService.findAllFaq();
	        if (allFaqList == null || allFaqList.isEmpty()) {
	            faqList = Collections.emptyList();
	        } else {
	            List<FaqDTO> filteredFaqList = new ArrayList<>();
	            String keywordLower = normalizedKeyword == null ? null : normalizedKeyword.toLowerCase(Locale.ROOT);

	            for (FaqDTO faq : allFaqList) {
	                if (faq == null) {
	                    continue;
	                }

	                String faqCategory = faq.getCategory() == null ? "" : faq.getCategory().trim();
	                if (!faqCategory.isEmpty() && !faqCategoryOptions.contains(faqCategory)) {
	                    faqCategoryOptions.add(faqCategory);
	                }

	                if (normalizedCategory != null && !faqCategory.equalsIgnoreCase(normalizedCategory)) {
	                    continue;
	                }

	                if (keywordLower != null) {
	                    String question = faq.getQuestion() == null ? "" : faq.getQuestion();
	                    String answer = faq.getAnswer() == null ? "" : faq.getAnswer();
	                    boolean matched = question.toLowerCase(Locale.ROOT).contains(keywordLower)
	                        || answer.toLowerCase(Locale.ROOT).contains(keywordLower)
	                        || faqCategory.toLowerCase(Locale.ROOT).contains(keywordLower);

	                    if (!matched) {
	                        continue;
	                    }
	                }

	                filteredFaqList.add(faq);
	            }

	            faqList = filteredFaqList;
	        }
	    } catch (Exception e) {
	        faqLoadError = e.getClass().getSimpleName() + ": " + e.getMessage();
	        e.printStackTrace();
	    }

	    model.addAttribute("faqList", faqList);
	    model.addAttribute("faqCategoryOptions", faqCategoryOptions);
	    model.addAttribute("faqLoadError", faqLoadError);
	    model.addAttribute("currentKeyword", normalizedKeyword);
	    model.addAttribute("currentCategory", normalizedCategory);
	    return "admin/admin-faq";
	}

	@GetMapping("/faq/detail")
	@ResponseBody
	public Map<String, Object> getFaqDetailForAdmin(@RequestParam int faqId) {
	    FaqDTO faq = faqService.findFaqById(faqId);

	    if (faq == null) {
	        return null;
	    }

	    Map<String, Object> result = new LinkedHashMap<>();
	    result.put("faqId", faq.getFaqId());
	    result.put("category", faq.getCategory());
	    result.put("question", faq.getQuestion());
	    result.put("answer", faq.getAnswer());
	    result.put("viewCount", faq.getViewCount());
	    result.put("createdAt", faq.getCreatedAt() != null ? faq.getCreatedAt().toString() : null);
	    return result;
	}

	// Admin QnA page
	@GetMapping("/qna")
	public String inquiryAdmin(
	        @RequestParam(value = "keyword", required = false) String keyword,
	        @RequestParam(value = "status", required = false) String status,
	        @RequestParam(value = "userId", required = false) Integer userId,
	        Model model) {
	    String normalizedKeyword = (keyword != null && !keyword.trim().isEmpty()) ? keyword.trim() : null;
	    String normalizedStatusCandidate = (status != null) ? status.trim() : null;
	    String normalizedStatus = (normalizedStatusCandidate != null
	            && InquiryStatus.ADMIN_SEARCH_STATUSES.contains(normalizedStatusCandidate))
	            ? normalizedStatusCandidate
	            : null;
	    Integer normalizedUserId = (userId != null && userId > 0) ? userId : null;
	    List<InquiryDTO> inquiryList = Collections.emptyList();
	    String inquiryLoadError = null;
	    Map<String, Object> inquiryParams = new HashMap<>();

	    inquiryParams.put("keyword", normalizedKeyword);
	    inquiryParams.put("status", normalizedStatus);
	    inquiryParams.put("userId", normalizedUserId);

	    try {
	        inquiryList = inquiryService.findAdminInquiryList(inquiryParams);
	    } catch (Exception e) {
	        inquiryLoadError = e.getClass().getSimpleName() + ": " + e.getMessage();
	        e.printStackTrace();
	    }

	    model.addAttribute("statusOptions", InquiryStatus.ADMIN_SEARCH_STATUSES);
	    model.addAttribute("inquiryList", inquiryList);
	    model.addAttribute("inquiryLoadError", inquiryLoadError);
	    model.addAttribute("currentKeyword", normalizedKeyword);
	    model.addAttribute("currentStatus", normalizedStatus);
	    model.addAttribute("currentUserId", normalizedUserId);
	    return "admin/admin-qna-manage-v3";
	}

	@GetMapping("/qna/detail")
	@ResponseBody
	public Map<String, Object> getInquiryDetail(@RequestParam int inquiryId) {
	    InquiryDTO inquiry = inquiryService.findInquiryById(inquiryId);

	    if (inquiry == null) {
	        return null;
	    }

	    Map<String, Object> result = new LinkedHashMap<>();
	    result.put("inquiryId", inquiry.getInquiryId());
	    result.put("userId", inquiry.getUserId());
	    result.put("title", inquiry.getTitle());
	    result.put("content", inquiry.getContent());
	    result.put("status", inquiry.getStatus());
	    result.put("answerContent", inquiry.getAnswerContent());
	    result.put("createdAt", inquiry.getCreatedAt() != null ? inquiry.getCreatedAt().toString() : null);
	    result.put("answeredAt", inquiry.getAnsweredAt() != null ? inquiry.getAnsweredAt().toString() : null);
	    return result;
	}

	@PostMapping("/qna/answer")
	@ResponseBody
	public String answerInquiry(@RequestParam int inquiryId, @RequestParam String answerContent) {
	    String normalizedAnswerContent = answerContent == null ? "" : answerContent.trim();
	    if (normalizedAnswerContent.isEmpty()) {
	        return "fail:empty_answer";
	    }

	    InquiryDTO inquiry = new InquiryDTO();
	    inquiry.setInquiryId(inquiryId);
	    inquiry.setAnswerContent(normalizedAnswerContent);
	    inquiry.setStatus(InquiryStatus.ANSWERED);

	    try {
	        int result = inquiryService.saveInquiryAnswer(inquiry);
	        return result > 0 ? "success" : "fail";
	    } catch (Exception e) {
	        e.printStackTrace();
	        return "error";
	    }
	}

	@PostMapping("/qna/delete")
	@ResponseBody
	public String deleteInquiry(@RequestParam int inquiryId) {
	    try {
	        int result = inquiryService.removeInquiry(inquiryId);
	        return result > 0 ? "success" : "fail";
	    } catch (Exception e) {
	        e.printStackTrace();
	        return "error";
	    }
	}

	@GetMapping("/users")
	public String getUserList(
	        @RequestParam(value="sort", defaultValue="DESC") String sort,
	        @RequestParam(value="type", required=false) String type,
	        @RequestParam(value="keyword", required=false) String keyword,
	        Model model) {
	    
	    // Service에서 정렬과 검색을 함께 처리합니다.
	    List<User> userList = userService.searchUsers(type, keyword, sort);
	    model.addAttribute("userList", userList);
	    
	    return "admin/admin-user"; 
	}

	// 2. 회원 검색
	@GetMapping("/search")
	public String searchUsers(
	        @RequestParam("type") String type, 
	        @RequestParam("keyword") String keyword, 
	        @RequestParam(value="sort", defaultValue="DESC") String sort, // 정렬 파라미터
	        Model model) {
	    
	    // 검색 메서드는 type, keyword, sort 세 가지 값을 받습니다.
	    List<User> searchList = userService.searchUsers(type, keyword, sort);
	    
	    model.addAttribute("userList", searchList);
	    model.addAttribute("searchType", type);
	    model.addAttribute("keyword", keyword);
	    model.addAttribute("sort", sort);
	    
	    return "admin/admin-user";
	}
    
    // 회원 정보 권한 변경
    @PostMapping("/users/updateRole")
    @ResponseBody
    public String updateRole(@RequestParam int userId, @RequestParam String role) {
        // 1. 마스터 관리자 보호 (백엔드 최종 방어)
        if (userId == 1) {
            return "fail";
        }
        
        try {
            // 서비스 호출 결과를 화면 응답으로 변환합니다.
            boolean isUpdated = userService.changeUserRole(userId, role);
            
            // 실제 업데이트 결과에 따라 응답을 반환합니다.
            return isUpdated ? "success" : "fail";
        } catch (Exception e) {
            e.printStackTrace(); // 서버 로그 확인
            return "error";
        }
    }
    
    // 회원 상태 변경
    @PostMapping("/users/updateStatus")
    @ResponseBody
    public String updateStatus(@RequestParam int userId, @RequestParam String status) {
        // 1. 마스터 관리자 보호 (백엔드 최종 방어)
        if (userId == 1) {
            return "fail";
        }
        
        try {
            // 서비스 메서드 시그니처(int, String)에 맞춰 호출합니다.
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
        
        // 1. 검색 조건 정리
        String normalizedStatus = (status != null && !status.trim().isEmpty()) ? status.trim() : null;
        String normalizedKeyword = (keyword != null && !keyword.trim().isEmpty()) ? keyword.trim() : null;

        // 2. 관리자 전체 목록을 조회한 뒤 필터링합니다.
        // status/keyword가 비어 있으면 전체 목록을 보여줍니다.
        List<QuestDTO> questList;
        List<QuestDTO> activeQuestList = Collections.emptyList();
        List<QuestDTO> inactiveQuestList = Collections.emptyList();
        List<QuestDTO> deletedQuestList = Collections.emptyList();
        String questLoadError = null;
        try {
            List<QuestDTO> allQuests = questService.getAdminQuestList();
            if (allQuests == null || allQuests.isEmpty()) {
                questList = Collections.emptyList();
            } else {
                List<QuestDTO> filteredQuestList = new ArrayList<>();
                List<QuestDTO> groupedActiveQuestList = new ArrayList<>();
                List<QuestDTO> groupedInactiveQuestList = new ArrayList<>();
                List<QuestDTO> groupedDeletedQuestList = new ArrayList<>();
                String keywordLower = normalizedKeyword == null ? null : normalizedKeyword.toLowerCase(Locale.ROOT);

                for (QuestDTO quest : allQuests) {
                    if (quest == null) {
                        continue;
                    }

                    String questStatus = normalizeQuestStatus(quest);

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

                    if ("DELETED".equalsIgnoreCase(questStatus)) {
                        groupedDeletedQuestList.add(quest);
                    } else if ("INACTIVE".equalsIgnoreCase(questStatus)) {
                        groupedInactiveQuestList.add(quest);
                    } else {
                        groupedActiveQuestList.add(quest);
                    }
                }

                questList = filteredQuestList;
                activeQuestList = groupedActiveQuestList;
                inactiveQuestList = groupedInactiveQuestList;
                deletedQuestList = groupedDeletedQuestList;
            }
        } catch (Exception e) {
            e.printStackTrace();
            questList = java.util.Collections.emptyList();
            questLoadError = "퀘스트 목록 조회 중 오류가 발생했습니다.";
        }
        model.addAttribute("questList", questList);
        model.addAttribute("activeQuestList", activeQuestList);
        model.addAttribute("inactiveQuestList", inactiveQuestList);
        model.addAttribute("deletedQuestList", deletedQuestList);
        model.addAttribute("activeQuestCount", activeQuestList.size());
        model.addAttribute("inactiveQuestCount", inactiveQuestList.size());
        model.addAttribute("deletedQuestCount", deletedQuestList.size());
        model.addAttribute("questLoadError", questLoadError);
        
        // 3. 검색 조건 유지
        model.addAttribute("currentStatus", normalizedStatus);
        model.addAttribute("currentKeyword", normalizedKeyword);
        
        return "admin/admin-quest";
    }

    private String normalizeQuestStatus(QuestDTO quest) {
        if (quest == null || quest.getStatus() == null || quest.getStatus().trim().isEmpty()) {
            if (quest != null) {
                quest.setStatus("ACTIVE");
            }
            return "ACTIVE";
        }

        String normalizedStatus = quest.getStatus().trim().toUpperCase(Locale.ROOT);
        quest.setStatus(normalizedStatus);
        return normalizedStatus;
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

    // 3. 퀘스트 등록
    @GetMapping("/locations")
    public String locationList(
        @RequestParam(value = "keyword", required = false) String keyword,
        @RequestParam(value = "category", required = false) String category,
        Model model) {

        String normalizedKeyword = (keyword != null && !keyword.trim().isEmpty()) ? keyword.trim() : null;
        String normalizedCategory = (category != null && !category.trim().isEmpty()) ? category.trim().toUpperCase(Locale.ROOT) : null;

        List<LocationDTO> locationList;
        String locationLoadError = null;
        try {
            List<LocationDTO> allLocations = locationService.searchLocations(normalizedKeyword);
            if (allLocations == null || allLocations.isEmpty()) {
                locationList = Collections.emptyList();
            } else if (normalizedCategory == null) {
                locationList = allLocations;
            } else {
                List<LocationDTO> filteredLocationList = new ArrayList<>();
                for (LocationDTO location : allLocations) {
                    if (location == null) {
                        continue;
                    }

                    String locationCategory = location.getLocationCategory() == null
                        ? "VISIT"
                        : location.getLocationCategory().trim().toUpperCase(Locale.ROOT);

                    if (normalizedCategory.equals(locationCategory)) {
                        filteredLocationList.add(location);
                    }
                }
                locationList = filteredLocationList;
            }
        } catch (Exception e) {
            e.printStackTrace();
            locationList = Collections.emptyList();
            locationLoadError = "장소 목록 조회 중 오류가 발생했습니다.";
        }

        model.addAttribute("locationList", locationList);
        model.addAttribute("locationCount", locationList.size());
        model.addAttribute("locationLoadError", locationLoadError);
        model.addAttribute("currentKeyword", normalizedKeyword);
        model.addAttribute("currentCategory", normalizedCategory);

        return "admin/admin-location";
    }

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

    @PostMapping("/locations/save")
    @ResponseBody
    public String saveLocation(LocationDTO location) {
        try {
            if (location == null) {
                return "fail:location_invalid";
            }
            if (location.getName() == null || location.getName().trim().isEmpty()) {
                return "fail:location_name_empty";
            }
            if (location.getZipCode() == null || location.getZipCode().trim().isEmpty()) {
                return "fail:zip_code_empty";
            }
            if (location.getAddress() == null || location.getAddress().trim().isEmpty()) {
                return "fail:address_empty";
            }
            if (location.getLatitude() == null || location.getLongitude() == null) {
                return "fail:coordinate_empty";
            }
            if (location.getLocationCategory() == null || location.getLocationCategory().trim().isEmpty()) {
                return "fail:location_category_empty";
            }

            location.setBusinessId(null);
            if (location.getLocationType() == null || location.getLocationType().trim().isEmpty()) {
                location.setLocationType("QUEST_SPOT");
            }
            location.setLocationCategory(location.getLocationCategory().trim().toUpperCase(Locale.ROOT));

            if (location.getLocationId() > 0) {
                return locationService.updateLocation(location) == 1 ? "success" : "fail";
            }

            return locationService.saveLocation(location) == 1 ? "success" : "fail";
        } catch (Exception e) {
            e.printStackTrace();
            return "error";
        }
    }

    @PostMapping("/quests/register")
    @ResponseBody
    public String registerQuest(
        QuestDTO quest,
        @RequestParam(value = "locationsJson", required = false) String locationsJson) { 
        try {
            // 요청 데이터 확인용 로그
            System.out.println(">>> 퀘스트 등록 요청 데이터: " + quest);
            
            // 필수값 검증
            if (quest.getTitle() == null || quest.getTitle().trim().isEmpty()) {
                return "fail:title_empty";
            }
            if (quest.getDescription() == null || quest.getDescription().trim().isEmpty()) {
                return "fail:description_empty";
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
            
            // 성공 시에는 반드시 "success"를 반환합니다.
            return isRegistered ? "success" : "fail";
            
        } catch (Exception e) {
            System.err.println("!!! 퀘스트 등록 중 서버 에러 발생 !!!");
            
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
     * 퀘스트 정보 수정 처리 (Ajax)
     */
    @PostMapping("/quests/update")
    @ResponseBody // Ajax 요청이므로 문자열을 직접 반환합니다.
    public String updateQuest(
        QuestDTO quest,
        @RequestParam(value = "locationsJson", required = false) String locationsJson) {
        try {
            // 요청 데이터 확인용 로그
            System.out.println(">>> 퀘스트 수정 요청 데이터: " + quest);

            // 입력값 검증
            if (quest.getQuestId() <= 0) {
                return "fail:invalid_id";
            }
            if (quest.getTitle() == null || quest.getTitle().trim().isEmpty()) {
                return "fail:title_empty";
            }
            if (quest.getDescription() == null || quest.getDescription().trim().isEmpty()) {
                return "fail:description_empty";
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

            // 결과 반환
            return isUpdated ? "success" : "fail";

        } catch (Exception e) {
            // 예외는 콘솔에 남기고 error를 반환합니다.
            System.err.println("!!! 퀘스트 수정 중 서버 에러 발생 !!!");
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

            String normalizedCategory = normalizeLocationCategory(location.getLocationCategory());
            if (location.getName() == null || location.getName().trim().isEmpty()) {
                return "fail:location_name_empty";
            }
            if (location.getAddress() == null || location.getAddress().trim().isEmpty()) {
                return "fail:location_address_empty";
            }

            if ("EXPERIENCE".equals(normalizedCategory) && location.getLocationId() <= 0) {
                return "fail:experience_location_existing_required";
            }

            if ("EXPERIENCE".equals(normalizedCategory)) {
                String activeQrAuthKey = locationService.findActiveQrAuthKeyByLocationId(location.getLocationId());
                if (activeQrAuthKey == null || activeQrAuthKey.trim().isEmpty()) {
                    return "fail:experience_location_active_qr_required";
                }
            }

            boolean requiresCoordinates =
                "VISIT".equals(normalizedCategory) || location.getLocationId() <= 0;
            if (requiresCoordinates && (location.getLatitude() == null || location.getLongitude() == null)) {
                return "fail:location_coordinate_empty";
            }
        }

        return null;
    }

    private String normalizeLocationCategory(String locationCategory) {
        if (locationCategory == null || locationCategory.trim().isEmpty()) {
            return "VISIT";
        }
        return locationCategory.trim().toUpperCase(Locale.ROOT);
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
     * 1. 리워드 아이템 목록 조회 (검색/필터 통합)
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

        // 서비스 조회
        List<RewardItemDTO> itemList = rewardItemService.getSearchItems(params);
        model.addAttribute("itemList", itemList);
        
        // 필터 상태 유지
        model.addAttribute("currentStatus", status);
        model.addAttribute("currentKeyword", keyword);

        return "admin/admin-reward-item"; // admin-shop.jsp로 이동
    }

    /**
     * 2. 리워드 아이템 저장/수정 처리 (Ajax)
     * URL: /admin/shop/save
     */
    @PostMapping("/shop/save")
    @ResponseBody
    public String saveItem(RewardItemDTO item) {
        try {
            boolean result;
            // rewardItemId가 0이면 등록, 아니면 수정
            if (item.getRewardItemId() == 0) {
                result = rewardItemService.registerItem(item);
            } else {
                result = rewardItemService.modifyItem(item);
            }
            return result ? "success" : "fail";
        } catch (Exception e) {
            System.err.println("!!! 상점 아이템 저장 중 서버 에러 발생 !!!");
            e.printStackTrace();
            return "error";
        }
    }

    /**
     * 3. 리워드 아이템 상태 변경 (Ajax)
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
            populateBusinessOperationInfo(businessList);
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
        applyBusinessOperationInfo(business);
        result.put("operationActive", business.getOperationActive());
        result.put("operationStatus", business.getOperationStatus());

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
            System.err.println("!!! 비즈니스 저장 중 서버 에러 발생 !!!");
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
            System.err.println("!!! 비즈니스 삭제 중 서버 에러 발생 !!!");
            e.printStackTrace();
            return "error";
        }
    }

    @PostMapping("/store-info/suspend")
    @ResponseBody
    public Map<String, Object> suspendBusinessOperation(@RequestParam int businessId) {
        try {
            BusinessQrInfoDTO qrInfo = locationQrService.suspendBusinessOperation(businessId);
            return createBusinessOperationResponse("success", "Business operation suspended.", qrInfo);
        } catch (NoSuchElementException e) {
            return createBusinessOperationResponse("fail", e.getMessage(), null);
        } catch (Exception e) {
            e.printStackTrace();
            return createBusinessOperationResponse("error", "Failed to suspend business operation.", null);
        }
    }

    @PostMapping("/store-info/resume")
    @ResponseBody
    public Map<String, Object> resumeBusinessOperation(@RequestParam int businessId) {
        try {
            BusinessQrInfoDTO qrInfo = locationQrService.resumeBusinessOperation(businessId);
            return createBusinessOperationResponse("success", "Business operation resumed.", qrInfo);
        } catch (NoSuchElementException e) {
            return createBusinessOperationResponse("fail", e.getMessage(), null);
        } catch (Exception e) {
            e.printStackTrace();
            return createBusinessOperationResponse("error", "Failed to resume business operation.", null);
        }
    }

    private void populateBusinessOperationInfo(List<BusinessDTO> businessList) {
        if (businessList == null || businessList.isEmpty()) {
            return;
        }

        for (BusinessDTO business : businessList) {
            applyBusinessOperationInfo(business);
        }
    }

    private void applyBusinessOperationInfo(BusinessDTO business) {
        if (business == null) {
            return;
        }

        try {
            BusinessQrInfoDTO operationInfo = locationQrService.getBusinessOperationInfo(business.getBusinessId());
            boolean active = operationInfo.isActive();
            business.setOperationActive(active);
            business.setOperationStatus(active ? "ACTIVE" : "INACTIVE");
        } catch (Exception e) {
            e.printStackTrace();
            business.setOperationActive(null);
            business.setOperationStatus("UNKNOWN");
        }
    }

    private Map<String, Object> createBusinessOperationResponse(
        String result,
        String message,
        BusinessQrInfoDTO qrInfo) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("result", result);
        response.put("message", message);

        if (qrInfo != null) {
            response.put("businessId", qrInfo.getBusinessId());
            response.put("locationId", qrInfo.getLocationId());
            response.put("qrId", qrInfo.getQrId());
            response.put("operationActive", qrInfo.isActive());
            response.put("operationStatus", qrInfo.isActive() ? "ACTIVE" : "INACTIVE");
        }

        return response;
    }

}


