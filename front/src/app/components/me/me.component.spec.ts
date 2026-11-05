import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { describe, beforeEach, it, expect, jest } from '@jest/globals';
import { of } from 'rxjs';
import { User } from '../../core/models/user.interface';
import { SessionService } from '../../core/service/session.service';
import { UserService } from '../../core/service/user.service';
import { MeComponent } from './me.component';

describe('MeComponent (unitaire)', () => {
  let fixture: ComponentFixture<MeComponent>;

  const userService = { getById: jest.fn(), delete: jest.fn() };
  const sessionService = { sessionInformation: { id: 1 }, logOut: jest.fn() };
  const router = { navigate: jest.fn() };
  const snackBar = { open: jest.fn() };

  const user: User = {
    id: 1,
    email: 'john@doe.com',
    firstName: 'John',
    lastName: 'Doe',
    admin: false,
    password: '',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-02-01')
  };

  const text = (): string => fixture.nativeElement.textContent;
  const deleteButton = (): HTMLButtonElement | undefined =>
    (Array.from(fixture.nativeElement.querySelectorAll('button')) as HTMLButtonElement[]).find(b =>
      b.textContent?.includes('delete')
    );

  const create = async (account: User): Promise<void> => {
    userService.getById.mockReturnValue(of(account));
    await TestBed.configureTestingModule({
      imports: [MeComponent],
      providers: [
        provideNoopAnimations(),
        { provide: UserService, useValue: userService },
        { provide: SessionService, useValue: sessionService },
        { provide: Router, useValue: router }
      ]
    })
      .overrideProvider(MatSnackBar, { useValue: snackBar })
      .compileComponents();
    fixture = TestBed.createComponent(MeComponent);
    fixture.detectChanges();
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('charge l\'utilisateur connecté à l\'initialisation', async () => {
    await create(user);

    expect(userService.getById).toHaveBeenCalledWith('1');
  });

  it('affiche les informations de l\'utilisateur', async () => {
    await create(user);

    expect(text()).toContain('Name: John DOE');
    expect(text()).toContain('Email: john@doe.com');
    expect(text()).toContain('Create at:');
    expect(text()).toContain('Last update:');
  });

  it('propose la suppression du compte à un utilisateur non admin', async () => {
    await create(user);

    expect(text()).toContain('Delete my account:');
    expect(text()).not.toContain('You are admin');
    expect(deleteButton()).toBeDefined();
  });

  it('indique "You are admin" et masque la suppression pour un admin', async () => {
    await create({ ...user, admin: true });

    expect(text()).toContain('You are admin');
    expect(text()).not.toContain('Delete my account:');
    expect(deleteButton()).toBeUndefined();
  });

  it('supprime le compte, déconnecte l\'utilisateur et redirige vers l\'accueil', async () => {
    userService.delete.mockReturnValue(of(undefined));
    await create(user);

    deleteButton()?.click();

    expect(userService.delete).toHaveBeenCalledWith('1');
    expect(snackBar.open).toHaveBeenCalledWith('Your account has been deleted !', 'Close', { duration: 3000 });
    expect(sessionService.logOut).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });

  it('le bouton retour revient à la page précédente', async () => {
    const back = jest.spyOn(window.history, 'back').mockImplementation(() => undefined);
    await create(user);

    fixture.nativeElement.querySelector('button').click();

    expect(back).toHaveBeenCalled();
  });
});
