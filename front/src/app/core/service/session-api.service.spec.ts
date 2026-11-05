import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { describe, beforeEach, afterEach, it, expect } from '@jest/globals';
import { Session } from '../models/session.interface';
import { SessionApiService } from './session-api.service';

describe('SessionApiService', () => {
  let service: SessionApiService;
  let httpMock: HttpTestingController;

  const session: Session = {
    id: 1,
    name: 'Morning flow',
    description: 'Relax',
    date: new Date('2026-01-01'),
    teacher_id: 2,
    users: [3]
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(SessionApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('all() récupère la liste des sessions', () => {
    let result: Session[] | undefined;

    service.all().subscribe(sessions => (result = sessions));

    const req = httpMock.expectOne('api/session');
    expect(req.request.method).toBe('GET');
    req.flush([session]);
    expect(result).toEqual([session]);
  });

  it('detail() récupère une session par son id', () => {
    let result: Session | undefined;

    service.detail('1').subscribe(s => (result = s));

    const req = httpMock.expectOne('api/session/1');
    expect(req.request.method).toBe('GET');
    req.flush(session);
    expect(result).toEqual(session);
  });

  it('delete() envoie un DELETE sur la session', () => {
    service.delete('1').subscribe();

    const req = httpMock.expectOne('api/session/1');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('create() envoie un POST avec la session', () => {
    service.create(session).subscribe();

    const req = httpMock.expectOne('api/session');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(session);
    req.flush(session);
  });

  it('update() envoie un PUT avec la session sur son id', () => {
    service.update('1', session).subscribe();

    const req = httpMock.expectOne('api/session/1');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(session);
    req.flush(session);
  });

  it('participate() envoie un POST sur la route de participation', () => {
    service.participate('1', '3').subscribe();

    const req = httpMock.expectOne('api/session/1/participate/3');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toBeNull();
    req.flush(null);
  });

  it('unParticipate() envoie un DELETE sur la route de participation', () => {
    service.unParticipate('1', '3').subscribe();

    const req = httpMock.expectOne('api/session/1/participate/3');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
