package com.app.dto.reward;

import java.util.List;

import lombok.Data;

@Data
public class RewardBoxSummary {

	private String nickname;
	private Integer exp;
	private Integer point;
	private Integer currentLevel;
	private Integer currentLevelMinExp;
	private Integer nextLevel;
	private Integer nextLevelMinExp;
	private String currentGradeName;
	private Integer currentGradeMinLevel;
	private Integer currentGradeMaxLevel;
	private String nextGradeName;
	private Integer nextGradeMinLevel;
	private Integer nextLevelRemainXp;
	private Integer progressPercent;
	private Integer remainLevelToNextGrade;
	private List<RewardRoadmapItem> roadmap;
}
