package com.openclassrooms.starterjwt.services;

import com.openclassrooms.starterjwt.exception.BadRequestException;
import com.openclassrooms.starterjwt.exception.NotFoundException;
import com.openclassrooms.starterjwt.models.Session;
import com.openclassrooms.starterjwt.models.User;
import com.openclassrooms.starterjwt.repository.SessionRepository;
import com.openclassrooms.starterjwt.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("SessionService (unitaire)")
class SessionServiceTest {

    @Mock
    private SessionRepository sessionRepository;
    @Mock
    private UserRepository userRepository;
    @InjectMocks
    private SessionService sessionService;

    private static User user(long id) {
        return new User().setId(id).setEmail("user" + id + "@yoga.com");
    }

    private static Session session(long id, User... participants) {
        return new Session().setId(id).setUsers(new ArrayList<>(List.of(participants)));
    }

    @Test
    @DisplayName("create() enregistre la session et renvoie celle du repository")
    void create_savesAndReturnsTheSession() {
        Session toSave = new Session().setName("Morning flow");
        Session saved = new Session().setId(1L).setName("Morning flow");
        when(sessionRepository.save(toSave)).thenReturn(saved);

        assertThat(sessionService.create(toSave)).isSameAs(saved);
    }

    @Test
    @DisplayName("delete() supprime une session existante")
    void delete_existingSession_deletesIt() {
        when(sessionRepository.findById(1L)).thenReturn(Optional.of(session(1L)));

        sessionService.delete(1L);

        verify(sessionRepository).deleteById(1L);
    }

    @Test
    @DisplayName("delete() lève NotFoundException et ne supprime rien pour une session inconnue")
    void delete_unknownSession_throwsNotFoundAndDeletesNothing() {
        when(sessionRepository.findById(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> sessionService.delete(1L)).isInstanceOf(NotFoundException.class);

        verify(sessionRepository, never()).deleteById(any());
    }

    @Test
    @DisplayName("findAll() renvoie toutes les sessions du repository")
    void findAll_returnsAllSessions() {
        List<Session> sessions = List.of(session(1L), session(2L));
        when(sessionRepository.findAll()).thenReturn(sessions);

        assertThat(sessionService.findAll()).isEqualTo(sessions);
    }

    @Test
    @DisplayName("getById() renvoie la session existante")
    void getById_existingSession_returnsIt() {
        Session session = session(1L);
        when(sessionRepository.findById(1L)).thenReturn(Optional.of(session));

        assertThat(sessionService.getById(1L)).isSameAs(session);
    }

    @Test
    @DisplayName("getById() lève NotFoundException pour une session inconnue")
    void getById_unknownSession_throwsNotFound() {
        when(sessionRepository.findById(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> sessionService.getById(1L)).isInstanceOf(NotFoundException.class);
    }

    @Test
    @DisplayName("update() impose l'identifiant de l'URL avant d'enregistrer")
    void update_setsTheIdBeforeSaving() {
        Session session = new Session().setName("Renamed");
        when(sessionRepository.save(session)).thenReturn(session);

        Session result = sessionService.update(5L, session);

        assertThat(result.getId()).isEqualTo(5L);
        verify(sessionRepository).save(session);
    }

    @Test
    @DisplayName("participate() ajoute l'utilisateur à la session et l'enregistre")
    void participate_addsUserAndSavesSession() {
        Session session = session(1L);
        User user = user(2L);
        when(sessionRepository.findById(1L)).thenReturn(Optional.of(session));
        when(userRepository.findById(2L)).thenReturn(Optional.of(user));

        sessionService.participate(1L, 2L);

        assertThat(session.getUsers()).containsExactly(user);
        verify(sessionRepository).save(session);
    }

    @Test
    @DisplayName("participate() lève NotFoundException quand la session est inconnue")
    void participate_unknownSession_throwsNotFound() {
        when(sessionRepository.findById(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> sessionService.participate(1L, 2L)).isInstanceOf(NotFoundException.class);

        verify(sessionRepository, never()).save(any());
    }

    @Test
    @DisplayName("participate() lève NotFoundException quand l'utilisateur est inconnu")
    void participate_unknownUser_throwsNotFound() {
        when(sessionRepository.findById(1L)).thenReturn(Optional.of(session(1L)));
        when(userRepository.findById(2L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> sessionService.participate(1L, 2L)).isInstanceOf(NotFoundException.class);

        verify(sessionRepository, never()).save(any());
    }

    @Test
    @DisplayName("participate() lève BadRequestException quand l'utilisateur participe déjà")
    void participate_alreadyParticipating_throwsBadRequest() {
        User user = user(2L);
        when(sessionRepository.findById(1L)).thenReturn(Optional.of(session(1L, user)));
        when(userRepository.findById(2L)).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> sessionService.participate(1L, 2L)).isInstanceOf(BadRequestException.class);

        verify(sessionRepository, never()).save(any());
    }

    @Test
    @DisplayName("noLongerParticipate() retire seulement l'utilisateur demandé et enregistre la session")
    void noLongerParticipate_removesOnlyThatUserAndSavesSession() {
        User leaving = user(2L);
        User staying = user(3L);
        Session session = session(1L, leaving, staying);
        when(sessionRepository.findById(1L)).thenReturn(Optional.of(session));

        sessionService.noLongerParticipate(1L, 2L);

        assertThat(session.getUsers()).containsExactly(staying);
        verify(sessionRepository).save(session);
    }

    @Test
    @DisplayName("noLongerParticipate() lève NotFoundException quand la session est inconnue")
    void noLongerParticipate_unknownSession_throwsNotFound() {
        when(sessionRepository.findById(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> sessionService.noLongerParticipate(1L, 2L)).isInstanceOf(NotFoundException.class);
    }

    @Test
    @DisplayName("noLongerParticipate() lève BadRequestException quand l'utilisateur ne participe pas")
    void noLongerParticipate_notParticipating_throwsBadRequest() {
        when(sessionRepository.findById(1L)).thenReturn(Optional.of(session(1L, user(3L))));

        assertThatThrownBy(() -> sessionService.noLongerParticipate(1L, 2L)).isInstanceOf(BadRequestException.class);

        verify(sessionRepository, never()).save(any());
    }
}
