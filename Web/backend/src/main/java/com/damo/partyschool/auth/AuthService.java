package com.damo.partyschool.auth;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.damo.partyschool.user.Role;
import com.damo.partyschool.user.User;
import com.damo.partyschool.user.UserRepository;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public LoginResponse login(String username, String password, String client) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new AuthException("Invalid username or password"));
        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new AuthException("Invalid username or password");
        }

        String normalized = client == null ? "" : client.trim().toUpperCase();
        if ("WEB".equals(normalized) && user.getRole() == Role.MEMBER) {
            throw new AuthException("党员请使用移动端登录，Web 端仅限管理员和支部书记使用");
        }
        if ("MOBILE".equals(normalized) && user.getRole() != Role.MEMBER) {
            throw new AuthException("管理功能请使用 Web 端，移动端仅限党员使用");
        }

        String token = jwtService.generateToken(user);
        return new LoginResponse(token, UserView.from(user));
    }
}
