package com.openclassrooms.starterjwt.mapper;

import com.openclassrooms.starterjwt.dto.TeacherDto;
import com.openclassrooms.starterjwt.models.Teacher;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("TeacherMapper (unitaire)")
class TeacherMapperTest {

    private final TeacherMapper mapper = new TeacherMapperImpl();
    private final LocalDateTime now = LocalDateTime.of(2026, 1, 1, 10, 0);

    private Teacher teacher() {
        return new Teacher().setId(1L).setFirstName("Margot").setLastName("DELAHAYE").setCreatedAt(now).setUpdatedAt(now);
    }

    @Test
    @DisplayName("toDto() recopie tous les champs du professeur")
    void toDto_copiesAllFields() {
        TeacherDto dto = mapper.toDto(teacher());

        assertThat(dto.getId()).isEqualTo(1L);
        assertThat(dto.getFirstName()).isEqualTo("Margot");
        assertThat(dto.getLastName()).isEqualTo("DELAHAYE");
        assertThat(dto.getCreatedAt()).isEqualTo(now);
        assertThat(dto.getUpdatedAt()).isEqualTo(now);
    }

    @Test
    @DisplayName("toEntity() recopie tous les champs du DTO")
    void toEntity_copiesAllFields() {
        Teacher teacher = mapper.toEntity(mapper.toDto(teacher()));

        assertThat(teacher.getId()).isEqualTo(1L);
        assertThat(teacher.getFirstName()).isEqualTo("Margot");
        assertThat(teacher.getLastName()).isEqualTo("DELAHAYE");
    }

    @Test
    @DisplayName("les conversions d'un objet null renvoient null")
    void nullInputs_returnNull() {
        assertThat(mapper.toDto((Teacher) null)).isNull();
        assertThat(mapper.toEntity((TeacherDto) null)).isNull();
        assertThat(mapper.toDto((List<Teacher>) null)).isNull();
        assertThat(mapper.toEntity((List<TeacherDto>) null)).isNull();
    }

    @Test
    @DisplayName("les conversions de listes convertissent chaque élément")
    void lists_convertEachElement() {
        List<TeacherDto> dtos = mapper.toDto(List.of(teacher(), teacher().setId(2L)));
        List<Teacher> entities = mapper.toEntity(dtos);

        assertThat(dtos).extracting(TeacherDto::getId).containsExactly(1L, 2L);
        assertThat(entities).extracting(Teacher::getId).containsExactly(1L, 2L);
    }
}
