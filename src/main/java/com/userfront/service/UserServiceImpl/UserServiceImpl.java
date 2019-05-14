package com.userfront.service.UserServiceImpl;

import java.util.List;
import java.util.Set;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.userfront.dao.RoleDao;
import com.userfront.dao.UserDao;
import com.userfront.domain.User;
import com.userfront.domain.security.UserRole;
import com.userfront.service.AccountService;
import com.userfront.service.UserService;

@Service
@Transactional
public class UserServiceImpl implements UserService{
	
	private static final Logger LOG = LoggerFactory.getLogger(UserService.class);
	
	@Autowired
	private UserDao userDao;
	
	@Autowired
    private RoleDao roleDao;

    @Autowired
    private BCryptPasswordEncoder passwordEncoder;
    
    @Autowired
    private AccountService accountService;
	
	@Override
	public void save(User user) {
        userDao.save(user);
    }

    @Override
	public User findByUsername(String username) {
        return userDao.findByUsername(username);
    }
    
    @Override
	public User findByCompanyId(int companyId) {
		
		return  userDao.findByCompanyId(companyId);
	}

    @Override
	public User findByEmail(String email) {
        return userDao.findByEmail(email);
    }
    
    
    @Override
	public User createUser(User user, Set<UserRole> userRoles) {
        User localUser = userDao.findByUsername(user.getUsername());

        if (localUser != null) {
            LOG.info("User with username {} already exist. Nothing will be done. ", user.getUsername());
        } else {
            String encryptedPassword = passwordEncoder.encode(user.getPassword());
            user.setPassword(encryptedPassword);

            for (UserRole ur : userRoles) {
                roleDao.save(ur.getRole());
            }

            user.getUserRoles().addAll(userRoles);

            user.setPrimaryAccount(accountService.createPrimaryAccount());
            user.setSavingsAccount(accountService.createSavingsAccount());

            localUser = userDao.save(user);
        }

        return localUser;
    }
    

    @Override
	public boolean checkUsernameExists(String username) {
        if (null != findByUsername(username)) {
            return true;
        }

        return false;
    }
    
    
    @Override
	public boolean checkEmailExists(String email) {
        if (null != findByEmail(email)) {
            return true;
        }

        return false;
    }

    @Override
	public User saveUser (User user) {
        return userDao.save(user);
    }
    
    @Override
	public List<User> findUserList() {
        return userDao.findAll();
    }

    @Override
	public void enableUser (String username) {
        User user = findByUsername(username);
        user.setEnabled(true);
        userDao.save(user);
    }

    @Override
	public void disableUser (String username) {
        User user = findByUsername(username);
        user.setEnabled(false);
        System.out.println(user.isEnabled());
        userDao.save(user);
        System.out.println(username + " is disabled.");
    }

	@Override
	public boolean checkUserExists(String username, String email, int companyId) {
		 if (checkUsernameExists(username) || checkEmailExists(email) || checkCompanyIdExists(companyId) ) {
	            return true;
	        } else {
	            return false;
	        }
	}

	@Override
	public boolean checkCompanyIdExists(int companyId) {
		 if (null != findByCompanyId(companyId)) {
	            return true;
	        }

	        return false;
	}

	
}
