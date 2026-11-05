import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { describe, beforeEach, it, expect, jest } from '@jest/globals';
import { of } from 'rxjs';
import { Session } from '../../../../core/models/session.interface';
import { Teacher } from '../../../../core/models/teacher.interface';
import { SessionApiService } from '../../../../core/service/session-api.service';
import { SessionService } from '../../../../core/service/session.service';
import { TeacherService } from '../../../../core/service/teacher.service';
import { DetailComponent } from './detail.component';

describe('DetailComponent (unitaire)', () => {
  let fixture: ComponentFixture<DetailComponent>;

  const sessionApiService = {
    detail: jest.fn(),
    delete: jest.fn(),
    participate: jest.fn(),
    unParticipate: jest.fn()
  };
  const teacherService = { detail: jest.fn() };
  const sessionService = { sessionInformation: { id: 5, admin: false } };
  const router = { navigate: jest.fn() };
  const snackBar = { open: jest.fn() };

  const session: Session = {
    id: 1,
    name: 'morning flow',
    description: 'Relax and breathe',
    date: new Date('2026-01-01'),
    teacher_id: 2,
    users: [7, 8],
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-02')
  };
  const teacher: Teacher = {
    id: 2,
    firstName: 'Margot',
    lastName: 'Delahaye',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01')
  };

  const text = (): string => fixture.nativeElement.textContent;
  const button = (label: string): HTMLButtonElement | undefined =>
    (Array.from(fixture.nativeElement.querySelectorAll('button')) as HTMLButtonElement[]).find(b =>
      b.textContent?.includes(label)
    );

  const create = async (admin: boolean, users: number[] = session.users): Promise<void> => {
    sessionService.sessionInformation = { id: 5, admin };
    sessionApiService.detail.mockReturnValue(of({ ...session, users }));
    teacherService.detail.mockReturnValue(of(teacher));
    await TestBed.configureTestingModule({
      imports: [DetailComponent],
      providers: [
        provideNoopAnimations(),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: '1' }) } } },
        { provide: SessionApiService, useValue: sessionApiService },
        { provide: TeacherService, useValue: teacherService },
        { provide: SessionService, useValue: sessionService },
        { provide: Router, useValue: router }
      ]
    })
      .overrideProvider(MatSnackBar, { useValue: snackBar })
      .compileComponents();
    fixture = TestBed.createComponent(DetailComponent);
    fixture.detectChanges();
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('charge la session puis son professeur à l\'initialisation', async () => {
    await create(false);

    expect(sessionApiService.detail).toHaveBeenCalledWith('1');
    expect(teacherService.detail).toHaveBeenCalledWith('2');
  });

  it('affiche correctement les informations de la session', async () => {
    await create(false);

    expect(fixture.nativeElement.querySelector('h1').textContent).toContain('Morning Flow');
    expect(text()).toContain('2 attendees');
    expect(text()).toContain('Relax and breathe');
    expect(text()).toContain('Margot DELAHAYE');
    expect(text()).toContain('January 1, 2026');
  });

  it('affiche le bouton Delete et aucun bouton de participation pour un admin', async () => {
    await create(true);

    expect(button('Delete')).toBeDefined();
    expect(button('Participate')).toBeUndefined();
    expect(button('Do not participate')).toBeUndefined();
  });

  it('propose Participate à un utilisateur qui ne participe pas encore', async () => {
    await create(false);

    expect(button('Delete')).toBeUndefined();
    expect(button('Participate')).toBeDefined();
    expect(button('Do not participate')).toBeUndefined();
  });

  it('propose Do not participate à un utilisateur déjà inscrit', async () => {
    await create(false, [5, 7]);

    expect(button('Participate')).toBeUndefined();
    expect(button('Do not participate')).toBeDefined();
  });

  it('participate() inscrit l\'utilisateur puis recharge la session', async () => {
    sessionApiService.participate.mockReturnValue(of(undefined));
    await create(false);

    button('Participate')?.click();

    expect(sessionApiService.participate).toHaveBeenCalledWith('1', '5');
    expect(sessionApiService.detail).toHaveBeenCalledTimes(2);
  });

  it('unParticipate() désinscrit l\'utilisateur puis recharge la session', async () => {
    sessionApiService.unParticipate.mockReturnValue(of(undefined));
    await create(false, [5]);

    button('Do not participate')?.click();

    expect(sessionApiService.unParticipate).toHaveBeenCalledWith('1', '5');
    expect(sessionApiService.detail).toHaveBeenCalledTimes(2);
  });

  it('delete() supprime la session, prévient l\'utilisateur et revient à la liste', async () => {
    sessionApiService.delete.mockReturnValue(of(undefined));
    await create(true);

    button('Delete')?.click();

    expect(sessionApiService.delete).toHaveBeenCalledWith('1');
    expect(snackBar.open).toHaveBeenCalledWith('Session deleted !', 'Close', { duration: 3000 });
    expect(router.navigate).toHaveBeenCalledWith(['sessions']);
  });

  it('le bouton retour revient à la page précédente', async () => {
    const back = jest.spyOn(window.history, 'back').mockImplementation(() => undefined);
    await create(false);

    fixture.nativeElement.querySelector('button').click();

    expect(back).toHaveBeenCalled();
  });
});
