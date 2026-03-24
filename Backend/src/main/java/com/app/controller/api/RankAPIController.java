package com.app.controller.api;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.app.dto.rank.Rank;
import com.app.service.rank.RankService;

@RestController
@RequestMapping("/api")
public class RankAPIController {

	@Autowired
	RankService rankService;

	@GetMapping("/rankings")
	public List<Rank> getRankings() {
		return rankService.findRankList();
	}
}
