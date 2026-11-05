package com.openclassrooms.starterjwt.security.services;

import com.openclassrooms.starterjwt.models.User;
import com.openclassrooms.starterjwt.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("UserDetailsServiceImpl (unitaire)")
class UserDetailsServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @Test
    @DisplayName("loadUserByUsername() charge l'utilisateur à partir de son email")
    void loadUserByUsername_existingUser_returnsItsDetails() {
        User user = new User().setId(3L).setEmail("john@doe.com").setFirstName("John").setLastName("Doe").setPassword("encoded");
        when(userRepository.findByEmail("john@doe.com")).thenReturn(Optional.of(user));

        UserDetails details = new UserDetailsServiceImpl(userRepository).loadUserByUsername("john@doe.com");

        assertThat(details.getUsername()).isEqualTo("john@doe.com");
        assertThat(details.getPassword()).isEqualTo("encoded");
        UserDetailsImpl impl = (UserDetailsImpl) details;
        assertThat(impl.getId()).isEqualTo(3L);
        assertThat(impl.getFirstName()).isEqualTo("John");
        assertThat(impl.getLastName()).isEqualTo("Doe");
    }

    @Test
    @DisplayName("loadUserByUsername() lève UsernameNotFoundException pour un email inconnu")
    void loadUserByUsername_unknownEmail_throwsUsernameNotFound() {
        when(userRepository.findByEmail("ghost@doe.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> new UserDetailsServiceImpl(userRepository).loadUserByUsername("ghost@doe.com"))
                .isInstanceOf(UsernameNotFoundException.class)
                .hasMessageContaining("ghost@doe.com");
    }
}
