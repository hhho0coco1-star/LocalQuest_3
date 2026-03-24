package com.app.service.rank.impl;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.app.dao.rank.RankDAO;
import com.app.dto.rank.Rank;
import com.app.service.rank.RankService;

@Service
public class RankServiceImpl implements RankService {

	@Autowired
	RankDAO rankDAO;

	@Override
	public List<Rank> findRankList() {
		return rankDAO.findRankList();
	}
}
