import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { describe, beforeEach, it, expect, jest } from '@jest/globals';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../core/service/auth.service';
import { RegisterComponent } from './register.component';

describe('RegisterComponent (unitaire)', () => {
  let fixture: ComponentFixture<RegisterComponent>;
  let component: RegisterComponent;

  const authService = { register: jest.fn() };
  const router = { navigate: jest.fn() };

  const validValues = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@doe.com',
    password: 'secret123'
  };

  const input = (name: string): HTMLInputElement =>
    fixture.nativeElement.querySelector(`input[formControlName="${name}"]`);
  const submitButton = (): HTMLButtonElement => fixture.nativeElement.querySelector('button[type="submit"]');

  const type = (name: string, value: string): void => {
    input(name).value = value;
    input(name).dispatchEvent(new Event('input'));
    fixture.detectChanges();
  };

  const fillAll = (values: Record<string, string> = validValues): void => {
    Object.entries(values).forEach(([name, value]) => type(name, value));
  };

  const submitForm = (): void => {
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    await TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [
        provideNoopAnimations(),
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router }
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('affiche les 4 champs avec le bouton Submit désactivé tant que le formulaire est vide', () => {
    ['firstName', 'lastName', 'email', 'password'].forEach(name => expect(input(name)).not.toBeNull());
    expect(submitButton().disabled).toBe(true);
  });

  it.each(['firstName', 'lastName', 'email', 'password'])(
    'garde le bouton désactivé quand le champ obligatoire %s est manquant',
    missing => {
      fillAll({ ...validValues, [missing]: '' });

      expect(submitButton().disabled).toBe(true);
    }
  );

  it('active le bouton quand tous les champs sont valides', () => {
    fillAll();

    expect(submitButton().disabled).toBe(false);
  });

  it('refuse un mot de passe de moins de 6 caractères', () => {
    fillAll({ ...validValues, password: 'abc' });

    expect(submitButton().disabled).toBe(true);
  });

  it('refuse un prénom de moins de 3 caractères', () => {
    fillAll({ ...validValues, firstName: 'Jo' });

    expect(submitButton().disabled).toBe(true);
  });

  it('refuse un email invalide', () => {
    fillAll({ ...validValues, email: 'pas-un-email' });

    expect(submitButton().disabled).toBe(true);
  });

  it('crée le compte et redirige vers /login quand l\'inscription réussit', () => {
    authService.register.mockReturnValue(of(undefined));
    fillAll();

    submitForm();

    expect(authService.register).toHaveBeenCalledWith(validValues);
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
    expect(fixture.nativeElement.querySelector('.error')).toBeNull();
  });

  it('affiche un message d\'erreur quand l\'inscription échoue', () => {
    authService.register.mockReturnValue(throwError(() => new Error('400')));
    fillAll();

    submitForm();

    expect(component.onError).toBe(true);
    expect(fixture.nativeElement.querySelector('.error').textContent).toContain('An error occurred');
    expect(router.navigate).not.toHaveBeenCalled();
  });
});
