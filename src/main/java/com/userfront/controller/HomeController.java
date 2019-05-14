package com.userfront.controller;

import java.security.Principal;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

import com.userfront.dao.RoleDao;
import com.userfront.domain.PrimaryAccount;
import com.userfront.domain.PrimaryTransaction;
import com.userfront.domain.User;
import com.userfront.domain.security.UserRole;
import com.userfront.service.TransactionService;
import com.userfront.service.UserService;

@Controller
public class HomeController {
	
	@Autowired
	private UserService userService;
	
	@Autowired
    private RoleDao roleDao;
	
	@Autowired
	private TransactionService transactionService;
	
	@RequestMapping("/")
	public String home() {
		return "redirect:/userFront";
	}
	
	@RequestMapping("/login")
    public String login() {
        return "login";
    }

	
	@RequestMapping(value = "/signup", method = RequestMethod.GET)
    public String signup(Model model) {
        User user = new User();

        model.addAttribute("user", user);

        return "signup";
    }
	
	@RequestMapping(value = "/signup", method = RequestMethod.POST)
    public String signupPost(@ModelAttribute("user") User user,  Model model) {

        if(userService.checkUserExists(user.getUsername(), user.getEmail(), user.getCompanyId()))  {

            if (userService.checkEmailExists(user.getEmail())) {
                model.addAttribute("emailExists", true);
            }

            if (userService.checkUsernameExists(user.getUsername())) {
                model.addAttribute("usernameExists", true);
            }
            
            if(userService.checkCompanyIdExists(user.getCompanyId())) {
            	model.addAttribute("companyIdExists", true);
            }

            return "signup";
        } else {
        	 Set<UserRole> userRoles = new HashSet<>();
             userRoles.add(new UserRole(user, roleDao.findByName("ROLE_USER")));
             userRoles.add(new UserRole(user, roleDao.findByName("ROLE_ADMIN")));

            userService.createUser(user, userRoles);

            return "redirect:/";
        }
    }
	
	@RequestMapping("/userFront")
	public String primaryAccount(Model model, Principal principal) {
		List<PrimaryTransaction> primaryTransactionList = transactionService.findPrimaryTransactionList(principal.getName());
		
		User user = userService.findByUsername(principal.getName());
        PrimaryAccount primaryAccount = user.getPrimaryAccount();

        model.addAttribute("primaryAccount", primaryAccount);
        model.addAttribute("primaryTransactionList", primaryTransactionList);
		
		return "userFront";
	}

	@RequestMapping("/transferprogress")
	public String tranfer(Model model, Principal principal) {
	
		return "transferprogress";
	}
	
	@RequestMapping("/token")
	public String token(Model model, Principal principal) {
	
		return "token";
	}
	
}
