package com.openclassrooms.starterjwt.security.services;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("UserDetailsImpl (unitaire)")
class UserDetailsImplTest {

    private static UserDetailsImpl details(Long id) {
        return UserDetailsImpl.builder().id(id).username("user" + id).password("x").build();
    }

    @Test
    @DisplayName("n'accorde aucun rôle")
    void getAuthorities_isEmpty() {
        assertThat(details(1L).getAuthorities()).isEmpty();
    }

    @Test
    @DisplayName("le compte n'expire pas, n'est pas verrouillé et est actif")
    void accountStatus_isAlwaysValid() {
        UserDetailsImpl details = details(1L);

        assertThat(details.isAccountNonExpired()).isTrue();
        assertThat(details.isAccountNonLocked()).isTrue();
        assertThat(details.isCredentialsNonExpired()).isTrue();
        assertThat(details.isEnabled()).isTrue();
    }

    @Test
    @DisplayName("equals() est vrai pour le même objet")
    void equals_sameInstance_isTrue() {
        UserDetailsImpl details = details(1L);

        assertThat(details.equals(details)).isTrue();
    }

    @Test
    @DisplayName("equals() est vrai pour deux objets de même identifiant")
    void equals_sameId_isTrue() {
        assertThat(details(1L)).isEqualTo(details(1L));
    }

    @Test
    @DisplayName("equals() est faux pour deux identifiants différents")
    void equals_differentId_isFalse() {
        assertThat(details(1L)).isNotEqualTo(details(2L));
    }

    @Test
    @DisplayName("equals() est faux face à null ou à un autre type")
    void equals_nullOrOtherType_isFalse() {
        UserDetailsImpl details = details(1L);

        assertThat(details.equals(null)).isFalse();
        assertThat(details.equals("1")).isFalse();
    }
}
