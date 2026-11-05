package com.openclassrooms.starterjwt.security.jwt;

import com.openclassrooms.starterjwt.security.services.UserDetailsImpl;
import com.openclassrooms.starterjwt.security.services.UserDetailsServiceImpl;
import jakarta.servlet.ServletException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.io.IOException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuthTokenFilter (unitaire)")
class AuthTokenFilterTest {

    @Mock
    private JwtUtils jwtUtils;
    @Mock
    private UserDetailsServiceImpl userDetailsService;
    @InjectMocks
    private AuthTokenFilter filter;

    private final MockHttpServletRequest request = new MockHttpServletRequest();
    private final MockHttpServletResponse response = new MockHttpServletResponse();
    private final MockFilterChain chain = new MockFilterChain();

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    private void runFilter() throws ServletException, IOException {
        filter.doFilter(request, response, chain);
    }

    @Test
    @DisplayName("sans en-tête Authorization, aucun utilisateur n'est authentifié et la requête continue")
    void noAuthorizationHeader_doesNotAuthenticateButContinues() throws Exception {
        runFilter();

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        assertThat(chain.getRequest()).isNotNull();
        verify(jwtUtils, never()).validateJwtToken(org.mockito.ArgumentMatchers.anyString());
    }

    @Test
    @DisplayName("un en-tête sans préfixe Bearer est ignoré")
    void headerWithoutBearerPrefix_isIgnored() throws Exception {
        request.addHeader("Authorization", "Basic abc123");

        runFilter();

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(jwtUtils, never()).validateJwtToken(org.mockito.ArgumentMatchers.anyString());
    }

    @Test
    @DisplayName("un jeton Bearer valide authentifie l'utilisateur correspondant")
    void validBearerToken_authenticatesTheUser() throws Exception {
        UserDetailsImpl details = UserDetailsImpl.builder().id(1L).username("john@doe.com").password("x").build();
        request.addHeader("Authorization", "Bearer the-jwt");
        when(jwtUtils.validateJwtToken("the-jwt")).thenReturn(true);
        when(jwtUtils.getUserNameFromJwtToken("the-jwt")).thenReturn("john@doe.com");
        when(userDetailsService.loadUserByUsername("john@doe.com")).thenReturn(details);

        runFilter();

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        assertThat(authentication).isNotNull();
        assertThat(authentication.getPrincipal()).isSameAs(details);
        assertThat(chain.getRequest()).isNotNull();
    }

    @Test
    @DisplayName("un jeton Bearer invalide n'authentifie personne")
    void invalidBearerToken_doesNotAuthenticate() throws Exception {
        request.addHeader("Authorization", "Bearer bad-jwt");
        when(jwtUtils.validateJwtToken("bad-jwt")).thenReturn(false);

        runFilter();

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(userDetailsService, never()).loadUserByUsername(org.mockito.ArgumentMatchers.anyString());
        assertThat(chain.getRequest()).isNotNull();
    }

    @Test
    @DisplayName("un jeton valide d'un utilisateur introuvable n'authentifie personne mais la requête continue")
    void tokenOfUnknownUser_doesNotAuthenticateButContinues() throws Exception {
        request.addHeader("Authorization", "Bearer the-jwt");
        when(jwtUtils.validateJwtToken("the-jwt")).thenReturn(true);
        when(jwtUtils.getUserNameFromJwtToken("the-jwt")).thenReturn("ghost@doe.com");
        when(userDetailsService.loadUserByUsername("ghost@doe.com")).thenThrow(new UsernameNotFoundException("not found"));

        runFilter();

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        assertThat(chain.getRequest()).isNotNull();
    }
}
