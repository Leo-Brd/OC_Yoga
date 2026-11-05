package com.openclassrooms.starterjwt.mapper;

import com.openclassrooms.starterjwt.dto.SessionDto;
import com.openclassrooms.starterjwt.models.Session;
import com.openclassrooms.starterjwt.models.Teacher;
import com.openclassrooms.starterjwt.models.User;
import com.openclassrooms.starterjwt.services.TeacherService;
import com.openclassrooms.starterjwt.services.UserService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Date;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("SessionMapper (unitaire)")
class SessionMapperTest {

    @Mock
    private TeacherService teacherService;
    @Mock
    private UserService userService;
    @InjectMocks
    private SessionMapperImpl mapper;

    private final Date date = new Date(1_700_000_000_000L);

    private SessionDto dto(Long teacherId, List<Long> users) {
        SessionDto dto = new SessionDto();
        dto.setId(1L);
        dto.setName("Morning flow");
        dto.setDescription("Relax");
        dto.setDate(date);
        dto.setTeacher_id(teacherId);
        dto.setUsers(users);
        return dto;
    }

    @Test
    @DisplayName("toEntity() retrouve le professeur et les participants par leurs identifiants")
    void toEntity_resolvesTeacherAndUsersThroughServices() {
        Teacher teacher = new Teacher().setId(2L);
        User first = new User().setId(3L);
        User second = new User().setId(4L);
        when(teacherService.findById(2L)).thenReturn(teacher);
        when(userService.findById(3L)).thenReturn(first);
        when(userService.findById(4L)).thenReturn(second);

        Session session = mapper.toEntity(dto(2L, List.of(3L, 4L)));

        assertThat(session.getId()).isEqualTo(1L);
        assertThat(session.getName()).isEqualTo("Morning flow");
        assertThat(session.getDescription()).isEqualTo("Relax");
        assertThat(session.getDate()).isEqualTo(date);
        assertThat(session.getTeacher()).isSameAs(teacher);
        assertThat(session.getUsers()).containsExactly(first, second);
    }

    @Test
    @DisplayName("toEntity() sans professeur ni participants ne sollicite aucun service")
    void toEntity_withoutTeacherNorUsers_usesNoService() {
        Session session = mapper.toEntity(dto(null, null));

        assertThat(session.getTeacher()).isNull();
        assertThat(session.getUsers()).isEmpty();
        verifyNoInteractions(teacherService, userService);
    }

    @Test
    @DisplayName("toEntity() met null à la place d'un participant inconnu")
    void toEntity_unknownUser_isMappedToNull() {
        when(userService.findById(9L)).thenReturn(null);

        Session session = mapper.toEntity(dto(null, List.of(9L)));

        assertThat(session.getUsers()).containsExactly((User) null);
    }

    @Test
    @DisplayName("toDto() expose l'identifiant du professeur et ceux des participants")
    void toDto_exposesTeacherIdAndUserIds() {
        Session session = new Session().setId(1L).setName("Morning flow").setDescription("Relax").setDate(date)
                .setTeacher(new Teacher().setId(2L))
                .setUsers(List.of(new User().setId(3L), new User().setId(4L)));

        SessionDto dto = mapper.toDto(session);

        assertThat(dto.getId()).isEqualTo(1L);
        assertThat(dto.getName()).isEqualTo("Morning flow");
        assertThat(dto.getDescription()).isEqualTo("Relax");
        assertThat(dto.getDate()).isEqualTo(date);
        assertThat(dto.getTeacher_id()).isEqualTo(2L);
        assertThat(dto.getUsers()).containsExactly(3L, 4L);
    }

    @Test
    @DisplayName("toDto() sans professeur ni participants renvoie un identifiant null et une liste vide")
    void toDto_withoutTeacherNorUsers_returnsNullTeacherIdAndEmptyUsers() {
        SessionDto dto = mapper.toDto(new Session().setId(1L));

        assertThat(dto.getTeacher_id()).isNull();
        assertThat(dto.getUsers()).isEmpty();
    }

    @Test
    @DisplayName("les conversions d'un objet null renvoient null")
    void nullInputs_returnNull() {
        assertThat(mapper.toEntity((SessionDto) null)).isNull();
        assertThat(mapper.toDto((Session) null)).isNull();
        assertThat(mapper.toEntity((List<SessionDto>) null)).isNull();
        assertThat(mapper.toDto((List<Session>) null)).isNull();
    }

    @Test
    @DisplayName("les conversions de listes convertissent chaque élément")
    void lists_convertEachElement() {
        List<SessionDto> dtos = mapper.toDto(List.of(new Session().setId(1L), new Session().setId(2L)));
        List<Session> entities = mapper.toEntity(dtos);

        assertThat(dtos).extracting(SessionDto::getId).containsExactly(1L, 2L);
        assertThat(entities).extracting(Session::getId).containsExactly(1L, 2L);
    }
}
