package com.app.dao.faq.impl;

import java.util.List;

import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import com.app.dao.faq.FaqDAO;
import com.app.dto.faq.FaqDTO;

@Repository
public class FaqDAOImpl implements FaqDAO {

    @Autowired
    private SqlSessionTemplate sqlSessionTemplate;

 // 1. FAQ 등록
    @Override
    public int saveFaq(FaqDTO faq) {
        return sqlSessionTemplate.insert("faq_mapper.saveFaq", faq);
    }

    // 2-1. 전체 목록 조회
    @Override
    public List<FaqDTO> getFaqList() {
        return sqlSessionTemplate.selectList("faq_mapper.getFaqList");
    }

    // 2-2. 카테고리별 목록 조회
    @Override
    public List<FaqDTO> getFaqByCategory(String category) {
        return sqlSessionTemplate.selectList("faq_mapper.getFaqByCategory", category);
    }

    // 2-3. 상세 조회
    @Override
    public FaqDTO getFaqById(int faqId) {
        return sqlSessionTemplate.selectOne("faq_mapper.getFaqById", faqId);
    }

    // 2-4. 조회수 1 증가
    @Override
    public void updateViewCount(int faqId) {
        sqlSessionTemplate.update("faq_mapper.updateViewCount", faqId);
    }

    // 3. 수정
    @Override
    public int updateFaq(FaqDTO faq) {
        return sqlSessionTemplate.update("faq_mapper.updateFaq", faq);
    }

    // 4. 삭제
    @Override
    public int deleteFaq(int faqId) {
        return sqlSessionTemplate.delete("faq_mapper.deleteFaq", faqId);
    }
}
