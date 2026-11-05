package com.openclassrooms.starterjwt.services;

import com.openclassrooms.starterjwt.exception.NotFoundException;
import com.openclassrooms.starterjwt.exception.UnauthorizedException;
import com.openclassrooms.starterjwt.models.User;
import com.openclassrooms.starterjwt.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("UserService (unitaire)")
class UserServiceTest {

    @Mock
    private UserRepository userRepository;
    @InjectMocks
    private UserService userService;

    private static User user(long id, String email) {
        return new User().setId(id).setEmail(email);
    }

    @Test
    @DisplayName("delete() supprime le compte quand c'est celui de l'utilisateur connecté")
    void delete_ownAccount_deletesIt() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user(1L, "john@doe.com")));

        userService.delete(1L, "john@doe.com");

        verify(userRepository).deleteById(1L);
    }

    @Test
    @DisplayName("delete() lève NotFoundException pour un utilisateur inconnu")
    void delete_unknownUser_throwsNotFound() {
        when(userRepository.findById(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.delete(1L, "john@doe.com")).isInstanceOf(NotFoundException.class);

        verify(userRepository, never()).deleteById(any());
    }

    @Test
    @DisplayName("delete() lève UnauthorizedException et ne supprime rien pour le compte d'un autre")
    void delete_anotherUsersAccount_throwsUnauthorizedAndDeletesNothing() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user(1L, "owner@doe.com")));

        assertThatThrownBy(() -> userService.delete(1L, "intruder@doe.com")).isInstanceOf(UnauthorizedException.class);

        verify(userRepository, never()).deleteById(any());
    }

    @Test
    @DisplayName("findById() renvoie l'utilisateur existant")
    void findById_existingUser_returnsIt() {
        User user = user(1L, "john@doe.com");
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        assertThat(userService.findById(1L)).isSameAs(user);
    }

    @Test
    @DisplayName("findById() renvoie null pour un utilisateur inconnu")
    void findById_unknownUser_returnsNull() {
        when(userRepository.findById(1L)).thenReturn(Optional.empty());

        assertThat(userService.findById(1L)).isNull();
    }

    @Test
    @DisplayName("getById() renvoie l'utilisateur existant")
    void getById_existingUser_returnsIt() {
        User user = user(1L, "john@doe.com");
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        assertThat(userService.getById(1L)).isSameAs(user);
    }

    @Test
    @DisplayName("getById() lève NotFoundException pour un utilisateur inconnu")
    void getById_unknownUser_throwsNotFound() {
        when(userRepository.findById(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.getById(1L)).isInstanceOf(NotFoundException.class);
    }
}
