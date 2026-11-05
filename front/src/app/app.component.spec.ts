import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Router, provideRouter } from '@angular/router';
import { describe, beforeEach, it, expect, jest } from '@jest/globals';
import { BehaviorSubject } from 'rxjs';
import { AppComponent } from './app.component';
import { AuthService } from './core/service/auth.service';
import { SessionService } from './core/service/session.service';

describe('AppComponent (unitaire)', () => {
  let fixture: ComponentFixture<AppComponent>;
  let navigate: jest.SpiedFunction<Router['navigate']>;

  const logged$ = new BehaviorSubject<boolean>(false);
  const sessionService = { $isLogged: () => logged$.asObservable(), logOut: jest.fn() };

  const links = (): string[] =>
    Array.from(fixture.nativeElement.querySelectorAll('.link') as NodeListOf<HTMLElement>).map(
      link => link.textContent?.trim() ?? ''
    );

  const setLogged = (value: boolean): void => {
    logged$.next(value);
    fixture.detectChanges();
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    logged$.next(false);
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideNoopAnimations(),
        provideRouter([]),
        { provide: AuthService, useValue: {} },
        { provide: SessionService, useValue: sessionService }
      ]
    }).compileComponents();
    navigate = jest.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
  });

  it('affiche Login et Register quand l\'utilisateur est déconnecté', () => {
    expect(links()).toEqual(['Login', 'Register']);
  });

  it('affiche Sessions, Account et Logout quand l\'utilisateur est connecté', () => {
    setLogged(true);

    expect(links()).toEqual(['Sessions', 'Account', 'Logout']);
  });

  it('la déconnexion vide la session et redirige vers la racine', () => {
    setLogged(true);
    const logout = Array.from(fixture.nativeElement.querySelectorAll('.link') as NodeListOf<HTMLElement>).find(
      link => link.textContent?.trim() === 'Logout'
    );

    logout?.click();

    expect(sessionService.logOut).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith(['']);
  });
});
