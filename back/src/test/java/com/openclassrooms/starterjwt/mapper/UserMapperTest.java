package com.openclassrooms.starterjwt.mapper;

import com.openclassrooms.starterjwt.dto.UserDto;
import com.openclassrooms.starterjwt.models.User;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("UserMapper (unitaire)")
class UserMapperTest {

    private final UserMapper mapper = new UserMapperImpl();
    private final LocalDateTime now = LocalDateTime.of(2026, 1, 1, 10, 0);

    private User user() {
        return new User().setId(1L).setEmail("john@doe.com").setFirstName("John").setLastName("Doe")
                .setPassword("encoded").setAdmin(true).setCreatedAt(now).setUpdatedAt(now);
    }

    @Test
    @DisplayName("toDto() recopie tous les champs de l'utilisateur")
    void toDto_copiesAllFields() {
        UserDto dto = mapper.toDto(user());

        assertThat(dto.getId()).isEqualTo(1L);
        assertThat(dto.getEmail()).isEqualTo("john@doe.com");
        assertThat(dto.getFirstName()).isEqualTo("John");
        assertThat(dto.getLastName()).isEqualTo("Doe");
        assertThat(dto.getPassword()).isEqualTo("encoded");
        assertThat(dto.isAdmin()).isTrue();
        assertThat(dto.getCreatedAt()).isEqualTo(now);
        assertThat(dto.getUpdatedAt()).isEqualTo(now);
    }

    @Test
    @DisplayName("toEntity() recopie tous les champs du DTO")
    void toEntity_copiesAllFields() {
        User user = mapper.toEntity(mapper.toDto(user()));

        assertThat(user.getId()).isEqualTo(1L);
        assertThat(user.getEmail()).isEqualTo("john@doe.com");
        assertThat(user.getFirstName()).isEqualTo("John");
        assertThat(user.getLastName()).isEqualTo("Doe");
        assertThat(user.getPassword()).isEqualTo("encoded");
        assertThat(user.isAdmin()).isTrue();
    }

    @Test
    @DisplayName("les conversions d'un objet null renvoient null")
    void nullInputs_returnNull() {
        assertThat(mapper.toDto((User) null)).isNull();
        assertThat(mapper.toEntity((UserDto) null)).isNull();
        assertThat(mapper.toDto((List<User>) null)).isNull();
        assertThat(mapper.toEntity((List<UserDto>) null)).isNull();
    }

    @Test
    @DisplayName("les conversions de listes convertissent chaque élément")
    void lists_convertEachElement() {
        List<UserDto> dtos = mapper.toDto(List.of(user(), user().setId(2L)));
        List<User> entities = mapper.toEntity(dtos);

        assertThat(dtos).extracting(UserDto::getId).containsExactly(1L, 2L);
        assertThat(entities).extracting(User::getId).containsExactly(1L, 2L);
    }
}
