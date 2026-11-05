package com.openclassrooms.starterjwt.integration;

import com.openclassrooms.starterjwt.models.User;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@DisplayName("API /api/user (intégration)")
class UserControllerIntegrationTest extends AbstractIntegrationTest {

    @Test
    @DisplayName("GET /api/user/{id} renvoie l'utilisateur sans son mot de passe")
    void findById_existingUser_returnsItWithoutPassword() throws Exception {
        User user = saveUser("john@doe.com", false);
        flushAndClear();

        mockMvc.perform(get("/api/user/{id}", user.getId()).header(HttpHeaders.AUTHORIZATION, bearerFor(user)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(user.getId()))
                .andExpect(jsonPath("$.email").value("john@doe.com"))
                .andExpect(jsonPath("$.admin").value(false))
                .andExpect(jsonPath("$.password").doesNotExist());
    }

    @Test
    @DisplayName("GET /api/user/{id} renvoie 404 pour un utilisateur inconnu")
    void findById_unknownUser_returns404() throws Exception {
        User user = saveUser("john@doe.com", false);

        mockMvc.perform(get("/api/user/{id}", 999999).header(HttpHeaders.AUTHORIZATION, bearerFor(user)))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("GET /api/user/{id} renvoie 400 quand l'identifiant n'est pas un nombre")
    void findById_nonNumericId_returns400() throws Exception {
        User user = saveUser("john@doe.com", false);

        mockMvc.perform(get("/api/user/abc").header(HttpHeaders.AUTHORIZATION, bearerFor(user)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("DELETE /api/user/{id} supprime son propre compte")
    void delete_ownAccount_removesIt() throws Exception {
        User user = saveUser("john@doe.com", false);
        flushAndClear();

        mockMvc.perform(delete("/api/user/{id}", user.getId()).header(HttpHeaders.AUTHORIZATION, bearerFor(user)))
                .andExpect(status().isOk());

        flushAndClear();
        assertThat(userRepository.findById(user.getId())).isEmpty();
    }

    @Test
    @DisplayName("DELETE /api/user/{id} renvoie 401 pour le compte d'un autre utilisateur et ne supprime rien")
    void delete_anotherUsersAccount_returns401AndKeepsIt() throws Exception {
        User owner = saveUser("owner@doe.com", false);
        User intruder = saveUser("intruder@doe.com", false);
        flushAndClear();

        mockMvc.perform(delete("/api/user/{id}", owner.getId()).header(HttpHeaders.AUTHORIZATION, bearerFor(intruder)))
                .andExpect(status().isUnauthorized());

        flushAndClear();
        assertThat(userRepository.findById(owner.getId())).isPresent();
    }

    @Test
    @DisplayName("DELETE /api/user/{id} renvoie 404 pour un utilisateur inconnu")
    void delete_unknownUser_returns404() throws Exception {
        User user = saveUser("john@doe.com", false);

        mockMvc.perform(delete("/api/user/{id}", 999999).header(HttpHeaders.AUTHORIZATION, bearerFor(user)))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("DELETE /api/user/{id} renvoie 400 quand l'identifiant n'est pas un nombre")
    void delete_nonNumericId_returns400() throws Exception {
        User user = saveUser("john@doe.com", false);

        mockMvc.perform(delete("/api/user/abc").header(HttpHeaders.AUTHORIZATION, bearerFor(user)))
                .andExpect(status().isBadRequest());
    }
}
