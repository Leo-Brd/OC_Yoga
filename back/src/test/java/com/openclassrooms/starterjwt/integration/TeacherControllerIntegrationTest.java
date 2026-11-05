package com.openclassrooms.starterjwt.integration;

import com.openclassrooms.starterjwt.models.Teacher;
import com.openclassrooms.starterjwt.models.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@DisplayName("API /api/teacher (intégration)")
class TeacherControllerIntegrationTest extends AbstractIntegrationTest {

    private String token;

    @BeforeEach
    void setUp() {
        User user = saveUser("john@doe.com", false);
        token = bearerFor(user);
    }

    @Test
    @DisplayName("GET /api/teacher renvoie la liste des professeurs")
    void findAll_returnsAllTeachers() throws Exception {
        saveTeacher("Margot", "DELAHAYE");
        saveTeacher("Helene", "THIERCELIN");
        flushAndClear();

        mockMvc.perform(get("/api/teacher").header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].firstName").value("Margot"))
                .andExpect(jsonPath("$[1].lastName").value("THIERCELIN"));
    }

    @Test
    @DisplayName("GET /api/teacher/{id} renvoie le professeur demandé")
    void findById_existingTeacher_returnsIt() throws Exception {
        Teacher teacher = saveTeacher("Margot", "DELAHAYE");
        flushAndClear();

        mockMvc.perform(get("/api/teacher/{id}", teacher.getId()).header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(teacher.getId()))
                .andExpect(jsonPath("$.firstName").value("Margot"))
                .andExpect(jsonPath("$.lastName").value("DELAHAYE"));
    }

    @Test
    @DisplayName("GET /api/teacher/{id} renvoie 404 pour un professeur inconnu")
    void findById_unknownTeacher_returns404() throws Exception {
        mockMvc.perform(get("/api/teacher/{id}", 999999).header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("GET /api/teacher/{id} renvoie 400 quand l'identifiant n'est pas un nombre")
    void findById_nonNumericId_returns400() throws Exception {
        mockMvc.perform(get("/api/teacher/abc").header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("GET /api/teacher renvoie 401 sans jeton")
    void findAll_withoutToken_returns401() throws Exception {
        mockMvc.perform(get("/api/teacher")).andExpect(status().isUnauthorized());
    }
}
