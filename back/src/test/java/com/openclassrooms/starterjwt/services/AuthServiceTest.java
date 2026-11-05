package com.openclassrooms.starterjwt.services;

import com.openclassrooms.starterjwt.exception.BadRequestException;
import com.openclassrooms.starterjwt.models.User;
import com.openclassrooms.starterjwt.payload.request.LoginRequest;
import com.openclassrooms.starterjwt.payload.request.SignupRequest;
import com.openclassrooms.starterjwt.payload.response.JwtResponse;
import com.openclassrooms.starterjwt.repository.UserRepository;
import com.openclassrooms.starterjwt.security.jwt.JwtUtils;
import com.openclassrooms.starterjwt.security.services.UserDetailsImpl;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuthService (unitaire)")
class AuthServiceTest {

    @Mock
    private AuthenticationManager authenticationManager;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private JwtUtils jwtUtils;
    @Mock
    private UserRepository userRepository;
    @InjectMocks
    private AuthService authService;

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    private static LoginRequest loginRequest() {
        LoginRequest request = new LoginRequest();
        request.setEmail("john@doe.com");
        request.setPassword("secret123");
        return request;
    }

    private static Authentication authenticated() {
        UserDetailsImpl details = UserDetailsImpl.builder()
                .id(7L).username("john@doe.com").firstName("John").lastName("Doe").password("encoded").build();
        return new UsernamePasswordAuthenticationToken(details, null, List.of());
    }

    private static SignupRequest signupRequest() {
        SignupRequest request = new SignupRequest();
        request.setEmail("new@doe.com");
        request.setFirstName("John");
        request.setLastName("Doe");
        request.setPassword("secret123");
        return request;
    }

    @Test
    @DisplayName("login() authentifie avec l'email et le mot de passe puis renvoie le jeton et l'identité")
    void login_validCredentials_returnsJwtAndIdentity() {
        Authentication authentication = authenticated();
        User user = new User().setId(7L).setEmail("john@doe.com").setAdmin(true);
        when(authenticationManager.authenticate(any())).thenReturn(authentication);
        when(jwtUtils.generateJwtToken(authentication)).thenReturn("the-jwt");
        when(userRepository.findByEmail("john@doe.com")).thenReturn(Optional.of(user));

        JwtResponse response = authService.login(loginRequest());

        ArgumentCaptor<Authentication> captor = ArgumentCaptor.forClass(Authentication.class);
        verify(authenticationManager).authenticate(captor.capture());
        assertThat(captor.getValue().getPrincipal()).isEqualTo("john@doe.com");
        assertThat(captor.getValue().getCredentials()).isEqualTo("secret123");
        assertThat(response.getToken()).isEqualTo("the-jwt");
        assertThat(response.getType()).isEqualTo("Bearer");
        assertThat(response.getId()).isEqualTo(7L);
        assertThat(response.getUsername()).isEqualTo("john@doe.com");
        assertThat(response.getFirstName()).isEqualTo("John");
        assertThat(response.getLastName()).isEqualTo("Doe");
    }

    @Test
    @DisplayName("login() reprend le statut admin enregistré en base")
    void login_adminInDatabase_returnsAdminTrue() {
        Authentication authentication = authenticated();
        when(authenticationManager.authenticate(any())).thenReturn(authentication);
        when(jwtUtils.generateJwtToken(authentication)).thenReturn("the-jwt");
        when(userRepository.findByEmail("john@doe.com"))
                .thenReturn(Optional.of(new User().setEmail("john@doe.com").setAdmin(true)));

        assertThat(authService.login(loginRequest()).getAdmin()).isTrue();
    }

    @Test
    @DisplayName("login() renvoie admin=false quand l'utilisateur n'existe plus en base")
    void login_userMissingInDatabase_returnsAdminFalse() {
        Authentication authentication = authenticated();
        when(authenticationManager.authenticate(any())).thenReturn(authentication);
        when(jwtUtils.generateJwtToken(authentication)).thenReturn("the-jwt");
        when(userRepository.findByEmail("john@doe.com")).thenReturn(Optional.empty());

        assertThat(authService.login(loginRequest()).getAdmin()).isFalse();
    }

    @Test
    @DisplayName("login() laisse remonter l'erreur d'authentification quand les identifiants sont faux")
    void login_badCredentials_propagatesTheAuthenticationException() {
        when(authenticationManager.authenticate(any())).thenThrow(new BadCredentialsException("Bad credentials"));

        assertThatThrownBy(() -> authService.login(loginRequest())).isInstanceOf(BadCredentialsException.class);

        verify(jwtUtils, never()).generateJwtToken(any());
    }

    @Test
    @DisplayName("register() enregistre un utilisateur non admin avec le mot de passe chiffré")
    void register_newEmail_savesNonAdminUserWithEncodedPassword() {
        when(userRepository.existsByEmail("new@doe.com")).thenReturn(false);
        when(passwordEncoder.encode("secret123")).thenReturn("encoded");

        authService.register(signupRequest());

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        User saved = captor.getValue();
        assertThat(saved.getEmail()).isEqualTo("new@doe.com");
        assertThat(saved.getFirstName()).isEqualTo("John");
        assertThat(saved.getLastName()).isEqualTo("Doe");
        assertThat(saved.getPassword()).isEqualTo("encoded");
        assertThat(saved.isAdmin()).isFalse();
    }

    @Test
    @DisplayName("register() lève BadRequestException avec un message quand l'email est déjà pris")
    void register_emailAlreadyTaken_throwsBadRequestWithMessage() {
        when(userRepository.existsByEmail("new@doe.com")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(signupRequest()))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Error: Email is already taken!");

        verify(userRepository, never()).save(any());
    }
}
