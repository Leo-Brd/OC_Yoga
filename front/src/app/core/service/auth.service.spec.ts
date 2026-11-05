import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { describe, beforeEach, afterEach, it, expect } from '@jest/globals';
import { LoginRequest } from '../models/loginRequest.interface';
import { RegisterRequest } from '../models/registerRequest.interface';
import { SessionInformation } from '../models/sessionInformation.interface';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('register() envoie un POST sur /api/auth/register avec la requête', () => {
    const request: RegisterRequest = {
      email: 'john@doe.com',
      firstName: 'John',
      lastName: 'Doe',
      password: 'secret123'
    };
    let completed = false;

    service.register(request).subscribe({ complete: () => (completed = true) });

    const req = httpMock.expectOne('/api/auth/register');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush(null);
    expect(completed).toBe(true);
  });

  it('login() envoie un POST sur /api/auth/login et renvoie la session', () => {
    const request: LoginRequest = { email: 'yoga@studio.com', password: 'test!1234' };
    const response: SessionInformation = {
      token: 'jwt',
      type: 'Bearer',
      id: 1,
      username: 'yoga@studio.com',
      firstName: 'Admin',
      lastName: 'Admin',
      admin: true
    };
    let result: SessionInformation | undefined;

    service.login(request).subscribe(session => (result = session));

    const req = httpMock.expectOne('/api/auth/login');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush(response);
    expect(result).toEqual(response);
  });

  it('login() propage l\'erreur HTTP en cas de mauvais identifiants', () => {
    let status: number | undefined;

    service.login({ email: 'a@b.c', password: 'wrong' }).subscribe({
      error: error => (status = error.status)
    });

    httpMock.expectOne('/api/auth/login').flush(null, { status: 401, statusText: 'Unauthorized' });
    expect(status).toBe(401);
  });
});
