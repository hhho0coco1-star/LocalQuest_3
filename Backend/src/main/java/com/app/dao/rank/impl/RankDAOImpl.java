package com.app.dao.rank.impl;

import java.util.List;

import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import com.app.dao.rank.RankDAO;
import com.app.dto.rank.Rank;

@Repository

public class RankDAOImpl implements RankDAO {

	@Autowired
	SqlSessionTemplate sqlSessionTemplate;

	@Override
	public List<Rank> findRankList() {
		return sqlSessionTemplate.selectList("rank_mapper.findRankList");
	} 
}
