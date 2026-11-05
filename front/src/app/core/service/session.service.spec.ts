import { TestBed } from '@angular/core/testing';
import { describe, beforeEach, it, expect } from '@jest/globals';
import { SessionInformation } from '../models/sessionInformation.interface';
import { SessionService } from './session.service';

describe('SessionService', () => {
  let service: SessionService;

  const user: SessionInformation = {
    token: 'jwt',
    type: 'Bearer',
    id: 1,
    username: 'yoga@studio.com',
    firstName: 'Admin',
    lastName: 'Admin',
    admin: true
  };

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SessionService);
  });

  it('démarre déconnecté', () => {
    expect(service.isLogged).toBe(false);
    expect(service.sessionInformation).toBeUndefined();
  });

  it('logIn() mémorise la session et passe à connecté', () => {
    service.logIn(user);

    expect(service.isLogged).toBe(true);
    expect(service.sessionInformation).toEqual(user);
  });

  it('logOut() efface la session et repasse à déconnecté', () => {
    service.logIn(user);

    service.logOut();

    expect(service.isLogged).toBe(false);
    expect(service.sessionInformation).toBeUndefined();
  });

  it('$isLogged() émet la valeur courante puis chaque changement', () => {
    const emitted: boolean[] = [];
    service.$isLogged().subscribe(value => emitted.push(value));

    service.logIn(user);
    service.logOut();

    expect(emitted).toEqual([false, true, false]);
  });
});
