import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { describe, beforeEach, it, expect, jest } from '@jest/globals';
import { of } from 'rxjs';
import { Session } from '../../../../core/models/session.interface';
import { Teacher } from '../../../../core/models/teacher.interface';
import { SessionApiService } from '../../../../core/service/session-api.service';
import { SessionService } from '../../../../core/service/session.service';
import { TeacherService } from '../../../../core/service/teacher.service';
import { FormComponent } from './form.component';

describe('FormComponent (unitaire)', () => {
  let fixture: ComponentFixture<FormComponent>;
  let component: FormComponent;

  const sessionApiService = { detail: jest.fn(), create: jest.fn(), update: jest.fn() };
  const teacherService = { all: jest.fn() };
  const sessionService = { sessionInformation: { id: 1, admin: true } };
  const snackBar = { open: jest.fn() };
  const router = { url: '/sessions/create', navigate: jest.fn() };

  const teachers: Teacher[] = [
    { id: 1, firstName: 'Margot', lastName: 'DELAHAYE', createdAt: new Date(), updatedAt: new Date() },
    { id: 2, firstName: 'Helene', lastName: 'THIERCELIN', createdAt: new Date(), updatedAt: new Date() }
  ];
  const existing: Session = {
    id: 3,
    name: 'Morning flow',
    description: 'Relax',
    date: new Date('2026-01-15'),
    teacher_id: 2,
    users: []
  };
  const validForm = { name: 'Yoga', date: '2026-03-01', teacher_id: 1, description: 'Détente' };

  const saveButton = (): HTMLButtonElement => fixture.nativeElement.querySelector('button[type="submit"]');
  const title = (): string => fixture.nativeElement.querySelector('h1').textContent;
  const submitForm = (): void => {
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  };

  const create = async (options: { url?: string; admin?: boolean } = {}): Promise<void> => {
    router.url = options.url ?? '/sessions/create';
    sessionService.sessionInformation = { id: 1, admin: options.admin ?? true };
    teacherService.all.mockReturnValue(of(teachers));
    sessionApiService.detail.mockReturnValue(of(existing));
    await TestBed.configureTestingModule({
      imports: [FormComponent],
      providers: [
        provideNoopAnimations(),
        provideRouter([]),
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: '3' }) } } },
        { provide: SessionApiService, useValue: sessionApiService },
        { provide: TeacherService, useValue: teacherService },
        { provide: SessionService, useValue: sessionService }
      ]
    })
      .overrideProvider(MatSnackBar, { useValue: snackBar })
      .compileComponents();
    fixture = TestBed.createComponent(FormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('création', () => {
    it('affiche le titre "Create session" et un formulaire vide invalide', async () => {
      await create();

      expect(title()).toContain('Create session');
      expect(component.onUpdate).toBe(false);
      expect(component.sessionForm?.value.name).toBe('');
      expect(saveButton().disabled).toBe(true);
    });

    it.each(['name', 'date', 'teacher_id', 'description'])(
      'garde Save désactivé quand le champ obligatoire %s est manquant',
      async missing => {
        await create();

        component.sessionForm?.patchValue({ ...validForm, [missing]: missing === 'teacher_id' ? null : '' });
        fixture.detectChanges();

        expect(saveButton().disabled).toBe(true);
      }
    );

    it('active Save quand tous les champs sont renseignés', async () => {
      await create();

      component.sessionForm?.setValue(validForm);
      fixture.detectChanges();

      expect(saveButton().disabled).toBe(false);
    });

    it('crée la session, prévient l\'utilisateur et revient à la liste', async () => {
      sessionApiService.create.mockReturnValue(of(existing));
      await create();
      component.sessionForm?.setValue(validForm);

      submitForm();

      expect(sessionApiService.create).toHaveBeenCalledWith(validForm);
      expect(snackBar.open).toHaveBeenCalledWith('Session created !', 'Close', { duration: 3000 });
      expect(router.navigate).toHaveBeenCalledWith(['sessions']);
    });
  });

  describe('modification', () => {
    const updateUrl = '/sessions/update/3';

    it('charge la session et pré-remplit le formulaire', async () => {
      await create({ url: updateUrl });

      expect(sessionApiService.detail).toHaveBeenCalledWith('3');
      expect(title()).toContain('Update session');
      expect(component.sessionForm?.value).toEqual({
        name: 'Morning flow',
        date: '2026-01-15',
        teacher_id: 2,
        description: 'Relax'
      });
      expect(saveButton().disabled).toBe(false);
    });

    it('garde Save désactivé quand on vide un champ obligatoire', async () => {
      await create({ url: updateUrl });

      component.sessionForm?.patchValue({ name: '' });
      fixture.detectChanges();

      expect(saveButton().disabled).toBe(true);
    });

    it('modifie la session, prévient l\'utilisateur et revient à la liste', async () => {
      sessionApiService.update.mockReturnValue(of(existing));
      await create({ url: updateUrl });
      component.sessionForm?.patchValue({ name: 'Renamed' });

      submitForm();

      expect(sessionApiService.update).toHaveBeenCalledWith('3', {
        name: 'Renamed',
        date: '2026-01-15',
        teacher_id: 2,
        description: 'Relax'
      });
      expect(snackBar.open).toHaveBeenCalledWith('Session updated !', 'Close', { duration: 3000 });
      expect(router.navigate).toHaveBeenCalledWith(['sessions']);
    });
  });

  it('redirige vers /sessions un utilisateur non admin', async () => {
    await create({ admin: false });

    expect(router.navigate).toHaveBeenCalledWith(['/sessions']);
  });

  it('ne redirige pas un admin à l\'ouverture', async () => {
    await create({ admin: true });

    expect(router.navigate).not.toHaveBeenCalled();
  });
});
