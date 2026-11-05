package com.openclassrooms.starterjwt.integration;

import com.openclassrooms.starterjwt.models.Teacher;
import com.openclassrooms.starterjwt.models.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.containsInAnyOrder;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@DisplayName("API /api/session (intégration)")
class SessionControllerIntegrationTest extends AbstractIntegrationTest {

    private User admin;
    private User member;
    private Teacher margot;
    private Teacher helene;
    private String adminToken;

    @BeforeEach
    void setUp() {
        admin = saveUser("admin@yoga.com", true);
        member = saveUser("member@yoga.com", false);
        margot = saveTeacher("Margot", "DELAHAYE");
        helene = saveTeacher("Helene", "THIERCELIN");
        adminToken = bearerFor(admin);
    }

    private String sessionJson(String name, Long teacherId) throws Exception {
        Map<String, Object> body = new java.util.HashMap<>();
        body.put("name", name);
        body.put("date", "2026-03-01");
        body.put("teacher_id", teacherId);
        body.put("description", "Détente");
        return objectMapper.writeValueAsString(body);
    }

    @Test
    @DisplayName("GET /api/session renvoie toutes les sessions")
    void findAll_returnsAllSessions() throws Exception {
        saveSession("Morning flow", margot);
        saveSession("Evening stretch", helene);
        flushAndClear();

        mockMvc.perform(get("/api/session").header(HttpHeaders.AUTHORIZATION, adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[*].name", containsInAnyOrder("Morning flow", "Evening stretch")));
    }

    @Test
    @DisplayName("GET /api/session renvoie 401 sans jeton")
    void findAll_withoutToken_returns401() throws Exception {
        mockMvc.perform(get("/api/session")).andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("GET /api/session/{id} renvoie la session avec son professeur et ses participants")
    void findById_existingSession_returnsItWithTeacherAndUsers() throws Exception {
        Long id = saveSession("Morning flow", margot, member).getId();
        flushAndClear();

        mockMvc.perform(get("/api/session/{id}", id).header(HttpHeaders.AUTHORIZATION, adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(id))
                .andExpect(jsonPath("$.name").value("Morning flow"))
                .andExpect(jsonPath("$.teacher_id").value(margot.getId()))
                .andExpect(jsonPath("$.users[0]").value(member.getId()));
    }

    @Test
    @DisplayName("GET /api/session/{id} renvoie 404 pour une session inconnue")
    void findById_unknownSession_returns404() throws Exception {
        mockMvc.perform(get("/api/session/{id}", 999999).header(HttpHeaders.AUTHORIZATION, adminToken))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("GET /api/session/{id} renvoie 400 quand l'identifiant n'est pas un nombre")
    void findById_nonNumericId_returns400() throws Exception {
        mockMvc.perform(get("/api/session/abc").header(HttpHeaders.AUTHORIZATION, adminToken))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /api/session crée la session en base")
    void create_validSession_isPersisted() throws Exception {
        mockMvc.perform(post("/api/session")
                        .header(HttpHeaders.AUTHORIZATION, adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(sessionJson("Yoga du soir", margot.getId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.name").value("Yoga du soir"))
                .andExpect(jsonPath("$.teacher_id").value(margot.getId()));

        flushAndClear();
        assertThat(sessionRepository.findAll()).extracting("name").containsExactly("Yoga du soir");
    }

    @Test
    @DisplayName("POST /api/session renvoie 400 quand le nom est manquant")
    void create_withoutName_returns400() throws Exception {
        mockMvc.perform(post("/api/session")
                        .header(HttpHeaders.AUTHORIZATION, adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(sessionJson("", margot.getId())))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("name")));

        assertThat(sessionRepository.count()).isZero();
    }

    @Test
    @DisplayName("POST /api/session renvoie 400 quand le professeur est manquant")
    void create_withoutTeacher_returns400() throws Exception {
        mockMvc.perform(post("/api/session")
                        .header(HttpHeaders.AUTHORIZATION, adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(sessionJson("Yoga du soir", null)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("teacher_id")));
    }

    @Test
    @DisplayName("PUT /api/session/{id} modifie la session existante")
    void update_existingSession_changesItsFields() throws Exception {
        Long id = saveSession("Morning flow", margot).getId();
        flushAndClear();

        mockMvc.perform(put("/api/session/{id}", id)
                        .header(HttpHeaders.AUTHORIZATION, adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(sessionJson("Renamed", helene.getId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(id))
                .andExpect(jsonPath("$.name").value("Renamed"))
                .andExpect(jsonPath("$.teacher_id").value(helene.getId()));

        flushAndClear();
        assertThat(sessionRepository.findById(id).orElseThrow().getName()).isEqualTo("Renamed");
    }

    @Test
    @DisplayName("PUT /api/session/{id} renvoie 400 quand l'identifiant n'est pas un nombre")
    void update_nonNumericId_returns400() throws Exception {
        mockMvc.perform(put("/api/session/abc")
                        .header(HttpHeaders.AUTHORIZATION, adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(sessionJson("Renamed", margot.getId())))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("DELETE /api/session/{id} supprime la session")
    void delete_existingSession_removesIt() throws Exception {
        Long id = saveSession("Morning flow", margot).getId();
        flushAndClear();

        mockMvc.perform(delete("/api/session/{id}", id).header(HttpHeaders.AUTHORIZATION, adminToken))
                .andExpect(status().isOk());

        flushAndClear();
        assertThat(sessionRepository.findById(id)).isEmpty();
    }

    @Test
    @DisplayName("DELETE /api/session/{id} renvoie 404 pour une session inconnue")
    void delete_unknownSession_returns404() throws Exception {
        mockMvc.perform(delete("/api/session/{id}", 999999).header(HttpHeaders.AUTHORIZATION, adminToken))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("DELETE /api/session/{id} renvoie 400 quand l'identifiant n'est pas un nombre")
    void delete_nonNumericId_returns400() throws Exception {
        mockMvc.perform(delete("/api/session/abc").header(HttpHeaders.AUTHORIZATION, adminToken))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /api/session/{id}/participate/{userId} inscrit l'utilisateur")
    void participate_validRequest_addsUserToSession() throws Exception {
        Long sessionId = saveSession("Morning flow", margot).getId();
        flushAndClear();

        mockMvc.perform(post("/api/session/{id}/participate/{userId}", sessionId, member.getId())
                        .header(HttpHeaders.AUTHORIZATION, adminToken))
                .andExpect(status().isOk());

        flushAndClear();
        List<Long> participants = sessionRepository.findById(sessionId).orElseThrow().getUsers().stream().map(User::getId).toList();
        assertThat(participants).containsExactly(member.getId());
    }

    @Test
    @DisplayName("POST /api/session/{id}/participate/{userId} renvoie 400 si l'utilisateur participe déjà")
    void participate_alreadyParticipating_returns400() throws Exception {
        Long sessionId = saveSession("Morning flow", margot, member).getId();
        flushAndClear();

        mockMvc.perform(post("/api/session/{id}/participate/{userId}", sessionId, member.getId())
                        .header(HttpHeaders.AUTHORIZATION, adminToken))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /api/session/{id}/participate/{userId} renvoie 404 pour une session inconnue")
    void participate_unknownSession_returns404() throws Exception {
        mockMvc.perform(post("/api/session/{id}/participate/{userId}", 999999, member.getId())
                        .header(HttpHeaders.AUTHORIZATION, adminToken))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("POST /api/session/{id}/participate/{userId} renvoie 404 pour un utilisateur inconnu")
    void participate_unknownUser_returns404() throws Exception {
        Long sessionId = saveSession("Morning flow", margot).getId();
        flushAndClear();

        mockMvc.perform(post("/api/session/{id}/participate/{userId}", sessionId, 999999)
                        .header(HttpHeaders.AUTHORIZATION, adminToken))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("POST /api/session/{id}/participate/{userId} renvoie 400 quand un identifiant n'est pas un nombre")
    void participate_nonNumericIds_returns400() throws Exception {
        mockMvc.perform(post("/api/session/abc/participate/1").header(HttpHeaders.AUTHORIZATION, adminToken))
                .andExpect(status().isBadRequest());
        mockMvc.perform(post("/api/session/1/participate/abc").header(HttpHeaders.AUTHORIZATION, adminToken))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("DELETE /api/session/{id}/participate/{userId} désinscrit l'utilisateur")
    void noLongerParticipate_participant_removesUserFromSession() throws Exception {
        Long sessionId = saveSession("Morning flow", margot, member).getId();
        flushAndClear();

        mockMvc.perform(delete("/api/session/{id}/participate/{userId}", sessionId, member.getId())
                        .header(HttpHeaders.AUTHORIZATION, adminToken))
                .andExpect(status().isOk());

        flushAndClear();
        assertThat(sessionRepository.findById(sessionId).orElseThrow().getUsers()).isEmpty();
    }

    @Test
    @DisplayName("DELETE /api/session/{id}/participate/{userId} renvoie 400 si l'utilisateur ne participe pas")
    void noLongerParticipate_notParticipating_returns400() throws Exception {
        Long sessionId = saveSession("Morning flow", margot).getId();
        flushAndClear();

        mockMvc.perform(delete("/api/session/{id}/participate/{userId}", sessionId, member.getId())
                        .header(HttpHeaders.AUTHORIZATION, adminToken))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("DELETE /api/session/{id}/participate/{userId} renvoie 404 pour une session inconnue")
    void noLongerParticipate_unknownSession_returns404() throws Exception {
        mockMvc.perform(delete("/api/session/{id}/participate/{userId}", 999999, member.getId())
                        .header(HttpHeaders.AUTHORIZATION, adminToken))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("DELETE /api/session/{id}/participate/{userId} renvoie 400 quand un identifiant n'est pas un nombre")
    void noLongerParticipate_nonNumericIds_returns400() throws Exception {
        mockMvc.perform(delete("/api/session/abc/participate/1").header(HttpHeaders.AUTHORIZATION, adminToken))
                .andExpect(status().isBadRequest());
        mockMvc.perform(delete("/api/session/1/participate/abc").header(HttpHeaders.AUTHORIZATION, adminToken))
                .andExpect(status().isBadRequest());
    }
}
