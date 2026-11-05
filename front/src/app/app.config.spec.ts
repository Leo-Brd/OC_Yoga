import { HttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { describe, beforeEach, afterEach, it, expect } from '@jest/globals';
import { appConfig } from './app.config';
import { routes } from './app.routes';
import { SessionService } from './core/service/session.service';

describe('appConfig (intégration)', () => {
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [...appConfig.providers, provideHttpClientTesting()]
    });
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('branche l\'intercepteur JWT sur le client HTTP de l\'application', () => {
    TestBed.inject(SessionService).logIn({
      token: 'prod-jwt',
      type: 'Bearer',
      id: 1,
      username: 'a@b.c',
      firstName: 'A',
      lastName: 'B',
      admin: false
    });

    TestBed.inject(HttpClient).get('/api/session').subscribe();

    const request = httpMock.expectOne('/api/session');
    expect(request.request.headers.get('Authorization')).toBe('Bearer prod-jwt');
    request.flush([]);
  });

  it('configure le routeur avec les routes de l\'application', () => {
    expect(TestBed.inject(Router).config).toEqual(routes);
  });
});
