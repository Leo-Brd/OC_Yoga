package com.openclassrooms.starterjwt.exception;

import com.openclassrooms.starterjwt.payload.response.MessageResponse;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BeanPropertyBindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@DisplayName("GlobalExceptionHandler (unitaire)")
class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    @DisplayName("NotFoundException devient un 404 sans corps")
    void handleNotFound_returns404WithoutBody() {
        ResponseEntity<Void> response = handler.handleNotFound();

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(response.getBody()).isNull();
    }

    @Test
    @DisplayName("BadRequestException avec message devient un 400 portant ce message")
    void handleBadRequest_withMessage_returns400WithMessage() {
        ResponseEntity<MessageResponse> response = handler.handleBadRequest(new BadRequestException("Error: Email is already taken!"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getMessage()).isEqualTo("Error: Email is already taken!");
    }

    @Test
    @DisplayName("BadRequestException sans message devient un 400 sans corps")
    void handleBadRequest_withoutMessage_returns400WithoutBody() {
        ResponseEntity<MessageResponse> response = handler.handleBadRequest(new BadRequestException());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).isNull();
    }

    @Test
    @DisplayName("un identifiant non numérique dans l'URL devient un 400 sans corps")
    void handleInvalidPathVariable_returns400WithoutBody() {
        ResponseEntity<Void> response = handler.handleInvalidPathVariable();

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).isNull();
    }

    @Test
    @DisplayName("UnauthorizedException devient un 401 sans corps")
    void handleUnauthorized_returns401WithoutBody() {
        ResponseEntity<Void> response = handler.handleUnauthorized();

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(response.getBody()).isNull();
    }

    @Test
    @DisplayName("une validation en échec devient un 400 listant chaque champ en erreur")
    void handleValidation_returns400ListingEachInvalidField() {
        BeanPropertyBindingResult bindingResult = new BeanPropertyBindingResult(new Object(), "signupRequest");
        bindingResult.addError(new FieldError("signupRequest", "password", "taille invalide"));
        bindingResult.addError(new FieldError("signupRequest", "email", "email invalide"));
        MethodArgumentNotValidException exception = mock(MethodArgumentNotValidException.class);
        when(exception.getBindingResult()).thenReturn(bindingResult);

        ResponseEntity<MessageResponse> response = handler.handleValidation(exception);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getMessage())
                .isEqualTo("password: taille invalide, email: email invalide");
    }
}
