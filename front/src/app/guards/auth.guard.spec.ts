import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { describe, beforeEach, it, expect, jest } from '@jest/globals';
import { SessionService } from '../core/service/session.service';
import { AuthGuard } from './auth.guard';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let sessionService: SessionService;
  const router = { navigate: jest.fn() };

  beforeEach(() => {
    router.navigate.mockClear();
    TestBed.configureTestingModule({
      providers: [{ provide: Router, useValue: router }]
    });
    guard = TestBed.inject(AuthGuard);
    sessionService = TestBed.inject(SessionService);
  });

  it('autorise l\'accès quand l\'utilisateur est connecté', () => {
    sessionService.isLogged = true;

    expect(guard.canActivate()).toBe(true);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('refuse l\'accès et redirige vers /login quand l\'utilisateur est déconnecté', () => {
    sessionService.isLogged = false;

    expect(guard.canActivate()).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['login']);
  });
});
