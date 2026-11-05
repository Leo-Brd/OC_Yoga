package com.openclassrooms.starterjwt.security.jwt;

import com.openclassrooms.starterjwt.security.services.UserDetailsImpl;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Base64;
import java.util.Date;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("JwtUtils (unitaire)")
class JwtUtilsTest {

    private static final String SECRET = Base64.getEncoder()
            .encodeToString("cle-secrete-de-test-pour-jwtutils-0123456789-abcdefghijklmnopqrstuvwxyz".getBytes());
    private static final String OTHER_SECRET = Base64.getEncoder()
            .encodeToString("une-autre-cle-secrete-differente-0123456789-abcdefghijklmnopqrstuvwxyz".getBytes());

    private JwtUtils jwtUtils;

    @BeforeEach
    void setUp() {
        jwtUtils = new JwtUtils();
        ReflectionTestUtils.setField(jwtUtils, "jwtSecret", SECRET);
        ReflectionTestUtils.setField(jwtUtils, "jwtExpirationMs", 60_000);
    }

    private static Authentication authenticationFor(String username) {
        UserDetailsImpl details = UserDetailsImpl.builder().id(1L).username(username).password("x").build();
        return new UsernamePasswordAuthenticationToken(details, null, List.of());
    }

    @Test
    @DisplayName("generateJwtToken() met l'identifiant de l'utilisateur dans le jeton")
    void generateJwtToken_storesUsernameAsSubject() {
        String token = jwtUtils.generateJwtToken(authenticationFor("john@doe.com"));

        assertThat(jwtUtils.getUserNameFromJwtToken(token)).isEqualTo("john@doe.com");
    }

    @Test
    @DisplayName("validateJwtToken() accepte un jeton valide")
    void validateJwtToken_validToken_returnsTrue() {
        String token = jwtUtils.generateJwtToken(authenticationFor("john@doe.com"));

        assertThat(jwtUtils.validateJwtToken(token)).isTrue();
    }

    @Test
    @DisplayName("validateJwtToken() refuse un jeton signé avec une autre clé")
    void validateJwtToken_tokenSignedWithAnotherKey_returnsFalse() {
        String token = Jwts.builder()
                .setSubject("john@doe.com")
                .setExpiration(new Date(System.currentTimeMillis() + 60_000))
                .signWith(SignatureAlgorithm.HS512, OTHER_SECRET)
                .compact();

        assertThat(jwtUtils.validateJwtToken(token)).isFalse();
    }

    @Test
    @DisplayName("validateJwtToken() refuse un jeton mal formé")
    void validateJwtToken_malformedToken_returnsFalse() {
        assertThat(jwtUtils.validateJwtToken("pas.un.jeton")).isFalse();
    }

    @Test
    @DisplayName("validateJwtToken() refuse un jeton expiré")
    void validateJwtToken_expiredToken_returnsFalse() {
        ReflectionTestUtils.setField(jwtUtils, "jwtExpirationMs", -1_000);
        String token = jwtUtils.generateJwtToken(authenticationFor("john@doe.com"));

        assertThat(jwtUtils.validateJwtToken(token)).isFalse();
    }

    @Test
    @DisplayName("validateJwtToken() refuse un jeton non signé")
    void validateJwtToken_unsignedToken_returnsFalse() {
        String unsigned = Jwts.builder().setSubject("john@doe.com").compact();

        assertThat(jwtUtils.validateJwtToken(unsigned)).isFalse();
    }

    @Test
    @DisplayName("validateJwtToken() refuse un jeton vide")
    void validateJwtToken_emptyToken_returnsFalse() {
        assertThat(jwtUtils.validateJwtToken("")).isFalse();
    }
}
