import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { describe, beforeEach, afterEach, it, expect } from '@jest/globals';
import { SessionService } from '../core/service/session.service';
import { customJwtInterceptorFn } from './customJwtInterceptorFn';

describe('customJwtInterceptorFn', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let sessionService: SessionService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([customJwtInterceptorFn])),
        provideHttpClientTesting()
      ]
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    sessionService = TestBed.inject(SessionService);
  });

  afterEach(() => httpMock.verify());

  it('ajoute l\'en-tête Authorization Bearer quand l\'utilisateur est connecté', () => {
    sessionService.logIn({
      token: 'my-jwt',
      type: 'Bearer',
      id: 1,
      username: 'a@b.c',
      firstName: 'A',
      lastName: 'B',
      admin: false
    });

    http.get('/api/session').subscribe();

    const req = httpMock.expectOne('/api/session');
    expect(req.request.headers.get('Authorization')).toBe('Bearer my-jwt');
    req.flush([]);
  });

  it('n\'ajoute aucun en-tête Authorization quand l\'utilisateur est déconnecté', () => {
    http.get('/api/session').subscribe();

    const req = httpMock.expectOne('/api/session');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush([]);
  });
});
