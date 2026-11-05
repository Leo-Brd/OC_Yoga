package com.openclassrooms.starterjwt.integration;

import com.openclassrooms.starterjwt.models.User;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;

import java.util.Base64;
import java.util.Date;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@DisplayName("Sécurité JWT sur /api (intégration)")
class SecurityIntegrationTest extends AbstractIntegrationTest {

    @Value("${oc.app.jwtSecret}")
    private String jwtSecret;

    private User user;

    @BeforeEach
    void setUp() {
        user = saveUser("john@doe.com", false);
        flushAndClear();
    }

    private String tokenSignedWith(String base64Secret, Date expiration) {
        return "Bearer " + Jwts.builder()
                .setSubject(user.getEmail())
                .setIssuedAt(new Date())
                .setExpiration(expiration)
                .signWith(SignatureAlgorithm.HS512, base64Secret)
                .compact();
    }

    private Date inOneHour() {
        return new Date(System.currentTimeMillis() + 3_600_000);
    }

    @Test
    @DisplayName("Un jeton valide donne accès à l'API")
    void validToken_grantsAccess() throws Exception {
        mockMvc.perform(get("/api/teacher").header(HttpHeaders.AUTHORIZATION, bearerFor(user)))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Une requête sans jeton est refusée avec 401")
    void noToken_returns401() throws Exception {
        mockMvc.perform(get("/api/teacher")).andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Un en-tête Authorization sans préfixe Bearer est refusé avec 401")
    void tokenWithoutBearerPrefix_returns401() throws Exception {
        String raw = bearerFor(user).substring("Bearer ".length());

        mockMvc.perform(get("/api/teacher").header(HttpHeaders.AUTHORIZATION, raw))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Un jeton mal formé est refusé avec 401")
    void malformedToken_returns401() throws Exception {
        mockMvc.perform(get("/api/teacher").header(HttpHeaders.AUTHORIZATION, "Bearer pas.un.jeton"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Un jeton signé avec une autre clé est refusé avec 401")
    void tokenSignedWithAnotherKey_returns401() throws Exception {
        String otherKey = Base64.getEncoder().encodeToString("une-autre-cle-secrete-differente-de-celle-de-l-application-0123456789".getBytes());

        mockMvc.perform(get("/api/teacher").header(HttpHeaders.AUTHORIZATION, tokenSignedWith(otherKey, inOneHour())))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Un jeton expiré est refusé avec 401")
    void expiredToken_returns401() throws Exception {
        String expired = tokenSignedWith(jwtSecret, new Date(System.currentTimeMillis() - 60_000));

        mockMvc.perform(get("/api/teacher").header(HttpHeaders.AUTHORIZATION, expired))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Un jeton valide d'un utilisateur supprimé est refusé avec 401")
    void tokenOfDeletedUser_returns401() throws Exception {
        String token = bearerFor(user);
        userRepository.deleteById(user.getId());
        flushAndClear();

        mockMvc.perform(get("/api/teacher").header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(status().isUnauthorized());
    }
}
