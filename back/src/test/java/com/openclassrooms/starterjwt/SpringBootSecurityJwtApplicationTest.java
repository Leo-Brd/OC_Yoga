package com.openclassrooms.starterjwt;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.MockedStatic;
import org.springframework.boot.SpringApplication;

import static org.mockito.Mockito.mockStatic;

@DisplayName("SpringBootSecurityJwtApplication (unitaire)")
class SpringBootSecurityJwtApplicationTest {

    @Test
    @DisplayName("main() démarre l'application Spring avec ses arguments")
    void main_runsTheSpringApplication() {
        String[] args = {"--spring.main.banner-mode=off"};

        try (MockedStatic<SpringApplication> springApplication = mockStatic(SpringApplication.class)) {
            SpringBootSecurityJwtApplication.main(args);

            springApplication.verify(() -> SpringApplication.run(SpringBootSecurityJwtApplication.class, args));
        }
    }
}
