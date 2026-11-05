package com.openclassrooms.starterjwt.integration;

import com.openclassrooms.starterjwt.models.User;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@DisplayName("API /api/auth (intégration)")
class AuthControllerIntegrationTest extends AbstractIntegrationTest {

    private String json(Map<String, ?> body) throws Exception {
        return objectMapper.writeValueAsString(body);
    }

    private String registerJson(String email, String firstName, String lastName, String password) throws Exception {
        return json(Map.of("email", email, "firstName", firstName, "lastName", lastName, "password", password));
    }

    @Test
    @DisplayName("POST /api/auth/login renvoie le jeton et les informations de l'utilisateur")
    void login_validCredentials_returnsJwtAndUserInformation() throws Exception {
        User user = saveUser("john@doe.com", false);
        flushAndClear();

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("email", "john@doe.com", "password", PASSWORD))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.type").value("Bearer"))
                .andExpect(jsonPath("$.id").value(user.getId()))
                .andExpect(jsonPath("$.username").value("john@doe.com"))
                .andExpect(jsonPath("$.firstName").value("John"))
                .andExpect(jsonPath("$.lastName").value("Doe"))
                .andExpect(jsonPath("$.admin").value(false));
    }

    @Test
    @DisplayName("POST /api/auth/login indique que l'utilisateur est admin quand il l'est en base")
    void login_adminUser_returnsAdminTrue() throws Exception {
        saveUser("admin@yoga.com", true);
        flushAndClear();

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("email", "admin@yoga.com", "password", PASSWORD))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.admin").value(true));
    }

    @Test
    @DisplayName("POST /api/auth/login renvoie 401 quand le mot de passe est faux")
    void login_wrongPassword_returns401() throws Exception {
        saveUser("john@doe.com", false);
        flushAndClear();

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("email", "john@doe.com", "password", "mauvais"))))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("POST /api/auth/login renvoie 401 quand l'email est inconnu")
    void login_unknownEmail_returns401() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("email", "inconnu@doe.com", "password", PASSWORD))))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("POST /api/auth/login renvoie 400 quand le mot de passe est manquant")
    void login_withoutPassword_returns400() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("email", "john@doe.com", "password", ""))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("password")));
    }

    @Test
    @DisplayName("POST /api/auth/register crée un compte non admin avec un mot de passe chiffré")
    void register_validRequest_createsNonAdminUserWithEncodedPassword() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registerJson("new@doe.com", "John", "Doe", "secret123")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("User registered successfully!"));

        flushAndClear();
        User saved = userRepository.findByEmail("new@doe.com").orElseThrow();
        assertThat(saved.isAdmin()).isFalse();
        assertThat(saved.getPassword()).isNotEqualTo("secret123");
        assertThat(passwordEncoder.matches("secret123", saved.getPassword())).isTrue();
    }

    @Test
    @DisplayName("Un compte créé avec /register peut ensuite se connecter avec /login")
    void register_thenLogin_succeeds() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registerJson("new@doe.com", "John", "Doe", "secret123")))
                .andExpect(status().isOk());
        flushAndClear();

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("email", "new@doe.com", "password", "secret123"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty());
    }

    @Test
    @DisplayName("POST /api/auth/register renvoie 400 avec un message quand l'email est déjà pris")
    void register_emailAlreadyTaken_returns400WithMessage() throws Exception {
        saveUser("john@doe.com", false);
        flushAndClear();

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registerJson("john@doe.com", "John", "Doe", "secret123")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Error: Email is already taken!"));

        assertThat(userRepository.count()).isEqualTo(1);
    }

    @Test
    @DisplayName("POST /api/auth/register renvoie 400 quand le mot de passe est trop court")
    void register_tooShortPassword_returns400() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registerJson("new@doe.com", "John", "Doe", "abc")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("password")));

        assertThat(userRepository.findByEmail("new@doe.com")).isEmpty();
    }

    @Test
    @DisplayName("POST /api/auth/register renvoie 400 quand l'email est invalide")
    void register_invalidEmail_returns400() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registerJson("pas-un-email", "John", "Doe", "secret123")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("email")));
    }
}
