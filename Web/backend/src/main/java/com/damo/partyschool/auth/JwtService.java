package com.damo.partyschool.auth;

import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.Optional;
import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.damo.partyschool.user.Role;
import com.damo.partyschool.user.User;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

@Service
public class JwtService {

    private final SecretKey key;
    private final long expireMs;

    public JwtService(
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.expire-ms}") long expireMs) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expireMs = expireMs;
    }

    public String generateToken(User user) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + expireMs);
        return Jwts.builder()
                .subject(user.getUsername())
                .claim("uid", user.getId())
                .claim("role", user.getRole().name())
                .claim("branchId", user.getBranchId())
                .issuedAt(now)
                .expiration(expiry)
                .signWith(key)
                .compact();
    }

    public Optional<Claims> parseClaims(String token) {
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
            return Optional.of(claims);
        } catch (Exception ex) {
            return Optional.empty();
        }
    }

    public Long getUid(Claims claims) {
        Object uid = claims.get("uid");
        if (uid instanceof Number number) {
            return number.longValue();
        }
        return null;
    }

    public Role getRole(Claims claims) {
        String role = claims.get("role", String.class);
        return role == null ? null : Role.valueOf(role);
    }

    public Long getBranchId(Claims claims) {
        Object branchId = claims.get("branchId");
        if (branchId instanceof Number number) {
            return number.longValue();
        }
        return null;
    }
}
