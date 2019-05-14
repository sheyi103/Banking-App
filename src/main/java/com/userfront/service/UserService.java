package com.userfront.service;

import java.util.List;
import java.util.Set;

import com.userfront.domain.User;
import com.userfront.domain.security.UserRole;

public interface UserService {
	User findByUsername(String username);
	
	User findByCompanyId(int companyId);

    User findByEmail(String email);

    boolean checkUserExists(String username, String email, int companyId);

    boolean checkUsernameExists(String username);

    boolean checkEmailExists(String email);
    
    boolean checkCompanyIdExists(int companyId);
    
    void save (User user);
    
    User createUser(User user, Set<UserRole> userRoles);
    
    User saveUser (User user); 
    
    List<User> findUserList();

    void enableUser (String username);

    void disableUser (String username);
}
