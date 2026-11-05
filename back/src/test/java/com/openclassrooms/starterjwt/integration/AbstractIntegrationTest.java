package com.openclassrooms.starterjwt.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.openclassrooms.starterjwt.models.Session;
import com.openclassrooms.starterjwt.models.Teacher;
import com.openclassrooms.starterjwt.models.User;
import com.openclassrooms.starterjwt.repository.SessionRepository;
import com.openclassrooms.starterjwt.repository.TeacherRepository;
import com.openclassrooms.starterjwt.repository.UserRepository;
import com.openclassrooms.starterjwt.security.jwt.JwtUtils;
import com.openclassrooms.starterjwt.security.services.UserDetailsImpl;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

/**
 * Base des tests d'intégration : application complète (controllers, services, repositories, sécurité JWT)
 * sur une base H2 en mémoire. Chaque test est exécuté dans une transaction annulée à la fin.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
abstract class AbstractIntegrationTest {

    protected static final String PASSWORD = "test!1234";

    @Autowired
    protected MockMvc mockMvc;
    @Autowired
    protected ObjectMapper objectMapper;
    @Autowired
    protected UserRepository userRepository;
    @Autowired
    protected TeacherRepository teacherRepository;
    @Autowired
    protected SessionRepository sessionRepository;
    @Autowired
    protected PasswordEncoder passwordEncoder;
    @Autowired
    protected JwtUtils jwtUtils;
    @PersistenceContext
    protected EntityManager entityManager;

    protected User saveUser(String email, boolean admin) {
        return userRepository.save(User.builder()
                .email(email)
                .firstName("John")
                .lastName("Doe")
                .password(passwordEncoder.encode(PASSWORD))
                .admin(admin)
                .build());
    }

    protected Teacher saveTeacher(String firstName, String lastName) {
        return teacherRepository.save(Teacher.builder().firstName(firstName).lastName(lastName).build());
    }

    protected Session saveSession(String name, Teacher teacher, User... participants) {
        return sessionRepository.save(Session.builder()
                .name(name)
                .description("Description de " + name)
                .date(new Date())
                .teacher(teacher)
                .users(new ArrayList<>(List.of(participants)))
                .build());
    }

    /** Envoie les écritures en base puis vide le cache : la requête relit ensuite vraiment la base. */
    protected void flushAndClear() {
        entityManager.flush();
        entityManager.clear();
    }

    protected String bearerFor(User user) {
        UserDetailsImpl details = UserDetailsImpl.builder()
                .id(user.getId())
                .username(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .password(user.getPassword())
                .build();
        return "Bearer " + jwtUtils.generateJwtToken(new UsernamePasswordAuthenticationToken(details, null, List.of()));
    }
}
