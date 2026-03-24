package com.app.dao.user.impl;

import java.util.List;
import java.util.Map;

import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import com.app.dao.user.UserDAO;
import com.app.dto.user.User;

@Repository
public class UserDAOImpl implements UserDAO {

	@Autowired
	private SqlSessionTemplate sqlSessionTemplate;
	
//    private static final String NAMESPACE = "com.app.dao.user.UserDAO";

	@Override
	public int saveUser(User user) {
		int result = sqlSessionTemplate.insert("user_mapper.saveUser", user);
		return result;
	}

	@Override
	public int countByUserLoginId(String userLoginId) {
		Integer count = sqlSessionTemplate.selectOne("user_mapper.countByUserLoginId", userLoginId);
		return count == null ? 0 : count;
	}

	@Override
	public int countByNickname(String nickname) {
		Integer count = sqlSessionTemplate.selectOne("user_mapper.countByNickname", nickname);
		return count == null ? 0 : count;
	}

	@Override
	public int countByEmail(String email) {
		Integer count = sqlSessionTemplate.selectOne("user_mapper.countByEmail", email);
		return count == null ? 0 : count;
	}
	
	@Override
	public User findByUserId(int userId) {
		return sqlSessionTemplate.selectOne("user_mapper.findByUserId", userId);
	}

	@Override
	public User findByUserLoginId(String userLoginId) {
		return sqlSessionTemplate.selectOne("user_mapper.findByUserLoginId", userLoginId);
	}

	@Override
	public User findByEmail(String email) {
		return sqlSessionTemplate.selectOne("user_mapper.findByEmail", email);
	}

	@Override
	public User findActiveUserByNameAndEmail(User user) {
		return sqlSessionTemplate.selectOne("user_mapper.findActiveUserByNameAndEmail", user);
	}

	@Override
	public User findActiveUserByUserLoginIdAndEmail(User user) {
		return sqlSessionTemplate.selectOne("user_mapper.findActiveUserByUserLoginIdAndEmail", user);
	}

	@Override
	public int updateMyProfileByUserId(User user) {
		return sqlSessionTemplate.update("user_mapper.updateMyProfileByUserId", user);
	}

	@Override
	public int updatePasswordByUserId(User user) {
		return sqlSessionTemplate.update("user_mapper.updatePasswordByUserId", user);
	}

	@Override
	public int updateSocialProfileByUserId(User user) {
		return sqlSessionTemplate.update("user_mapper.updateSocialProfileByUserId", user);
	}

    @Override
    public int updateUserRole(Map<String, Object> roleMap) {
        return sqlSessionTemplate.update("user_mapper.updateUserRole", roleMap);
    }

    @Override
    public int updateUserStatus(Map<String, Object> statusMap) {
        return sqlSessionTemplate.update("user_mapper.updateUserStatus", statusMap);
    }

	
    public List<User> searchUsers(Map<String, Object> searchParams) {
        return sqlSessionTemplate.selectList("user_mapper.searchUser", searchParams);
    }

}
