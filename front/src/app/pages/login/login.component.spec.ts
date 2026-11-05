import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { describe, beforeEach, it, expect, jest } from '@jest/globals';
import { of, throwError } from 'rxjs';
import { SessionInformation } from '../../core/models/sessionInformation.interface';
import { AuthService } from '../../core/service/auth.service';
import { SessionService } from '../../core/service/session.service';
import { LoginComponent } from './login.component';

describe('LoginComponent (unitaire)', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let component: LoginComponent;

  const authService = { login: jest.fn() };
  const sessionService = { logIn: jest.fn() };
  const router = { navigate: jest.fn() };

  const session: SessionInformation = {
    token: 'jwt',
    type: 'Bearer',
    id: 1,
    username: 'yoga@studio.com',
    firstName: 'Admin',
    lastName: 'Admin',
    admin: true
  };

  const input = (name: string): HTMLInputElement =>
    fixture.nativeElement.querySelector(`input[formControlName="${name}"]`);
  const submitButton = (): HTMLButtonElement => fixture.nativeElement.querySelector('button[type="submit"]');

  const type = (name: string, value: string): void => {
    input(name).value = value;
    input(name).dispatchEvent(new Event('input'));
    fixture.detectChanges();
  };

  const submitForm = (): void => {
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideNoopAnimations(),
        { provide: AuthService, useValue: authService },
        { provide: SessionService, useValue: sessionService },
        { provide: Router, useValue: router }
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('affiche le formulaire avec le bouton Submit désactivé tant qu\'il est vide', () => {
    expect(input('email')).not.toBeNull();
    expect(input('password')).not.toBeNull();
    expect(submitButton().disabled).toBe(true);
  });

  it('garde le bouton désactivé si un champ obligatoire est manquant', () => {
    type('email', 'yoga@studio.com');

    expect(submitButton().disabled).toBe(true);
  });

  it('garde le bouton désactivé si l\'email est invalide', () => {
    type('email', 'pas-un-email');
    type('password', 'test!1234');

    expect(submitButton().disabled).toBe(true);
  });

  it('active le bouton quand les deux champs sont valides', () => {
    type('email', 'yoga@studio.com');
    type('password', 'test!1234');

    expect(submitButton().disabled).toBe(false);
  });

  it('connecte l\'utilisateur et redirige vers /sessions quand le login réussit', () => {
    authService.login.mockReturnValue(of(session));
    type('email', 'yoga@studio.com');
    type('password', 'test!1234');

    submitForm();

    expect(authService.login).toHaveBeenCalledWith({ email: 'yoga@studio.com', password: 'test!1234' });
    expect(sessionService.logIn).toHaveBeenCalledWith(session);
    expect(router.navigate).toHaveBeenCalledWith(['/sessions']);
    expect(fixture.nativeElement.querySelector('.error')).toBeNull();
  });

  it('affiche un message d\'erreur quand le login échoue', () => {
    authService.login.mockReturnValue(throwError(() => new Error('401')));
    type('email', 'yoga@studio.com');
    type('password', 'mauvais');

    submitForm();

    expect(component.onError).toBe(true);
    expect(fixture.nativeElement.querySelector('.error').textContent).toContain('An error occurred');
    expect(sessionService.logIn).not.toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('bascule l\'affichage du mot de passe avec le bouton œil', () => {
    expect(input('password').type).toBe('password');

    fixture.nativeElement.querySelector('button[matSuffix]').click();
    fixture.detectChanges();

    expect(input('password').type).toBe('text');
  });
});
