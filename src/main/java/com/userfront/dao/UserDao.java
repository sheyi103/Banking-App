package com.userfront.dao;

import java.util.List;

import org.springframework.data.repository.CrudRepository;

import com.userfront.domain.User;

public interface UserDao extends CrudRepository<User, Long> {
	User findByUsername(String username);
	User findByCompanyId(int companyId);
    User findByEmail(String email);
    @Override
	List<User> findAll();
}
