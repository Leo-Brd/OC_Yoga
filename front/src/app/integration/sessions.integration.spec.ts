import { afterEach, describe, expect, it } from '@jest/globals';
import { AppHarness, adminSession, makeSession, memberSession, teachers } from '../testing/app-harness';

describe('Sessions (intégration)', () => {
  let app: AppHarness;

  afterEach(() => {
    app.http.verify();
  });

  const openList = async (
    user: typeof adminSession,
    sessions = [makeSession(), makeSession({ id: 2, name: 'evening stretch', teacher_id: 1 })]
  ): Promise<void> => {
    app = await AppHarness.start(user);
    await app.navigate('/sessions');
    await app.respond('GET', 'api/session', sessions);
  };

  describe('Liste', () => {
    it('affiche la liste des sessions en envoyant le jeton de l\'utilisateur', async () => {
      app = await AppHarness.start(memberSession);
      await app.navigate('/sessions');

      const request = app.expectRequest('GET', 'api/session');
      expect(request.request.headers.get('Authorization')).toBe('Bearer jwt-member');
      request.flush([makeSession(), makeSession({ id: 2, name: 'evening stretch' })]);
      await app.settle();

      expect(app.all('mat-card.item').length).toBe(2);
      expect(app.text).toContain('morning flow');
      expect(app.text).toContain('evening stretch');
    });

    it('n\'affiche aucune carte quand il n\'y a aucune session', async () => {
      await openList(memberSession, []);

      expect(app.all('mat-card.item').length).toBe(0);
    });

    it('affiche Create et Edit pour un admin', async () => {
      await openList(adminSession);

      expect(app.byText('button', 'Create').length).toBe(1);
      expect(app.byText('button', 'Edit').length).toBe(2);
      expect(app.byText('button', 'Detail').length).toBe(2);
    });

    it('masque Create et Edit pour un utilisateur non admin', async () => {
      await openList(memberSession);

      expect(app.byText('button', 'Create').length).toBe(0);
      expect(app.byText('button', 'Edit').length).toBe(0);
      expect(app.byText('button', 'Detail').length).toBe(2);
    });

    it('ouvre le détail d\'une session avec le bouton Detail', async () => {
      await openList(memberSession);

      await app.click(app.byText('button', 'Detail')[0]);
      expect(app.url).toBe('/sessions/detail/1');
      await app.respond('GET', 'api/session/1', makeSession());
      await app.respond('GET', 'api/teacher/2', teachers[1]);

      expect(app.text).toContain('Morning Flow');
    });

    it('ouvre le formulaire de création avec le bouton Create', async () => {
      await openList(adminSession);

      await app.click(app.byText('button', 'Create')[0]);
      expect(app.url).toBe('/sessions/create');
      await app.respond('GET', 'api/teacher', teachers);

      expect(app.text).toContain('Create session');
    });

    it('ouvre le formulaire de modification avec le bouton Edit', async () => {
      await openList(adminSession);

      await app.click(app.byText('button', 'Edit')[0]);
      expect(app.url).toBe('/sessions/update/1');
      await app.respond('GET', 'api/session/1', makeSession());
      await app.respond('GET', 'api/teacher', teachers);

      expect(app.text).toContain('Update session');
    });
  });

  describe('Détail', () => {
    const openDetail = async (user: typeof adminSession, users: number[] = [7, 8]): Promise<void> => {
      app = await AppHarness.start(user);
      await app.navigate('/sessions/detail/1');
      await app.respond('GET', 'api/session/1', makeSession({ users }));
      await app.respond('GET', 'api/teacher/2', teachers[1]);
    };

    it('affiche les informations de la session et de son professeur', async () => {
      await openDetail(memberSession);

      expect(app.element.querySelector('h1')?.textContent).toContain('Morning Flow');
      expect(app.text).toContain('2 attendees');
      expect(app.text).toContain('Relax and breathe');
      expect(app.text).toContain('Helene THIERCELIN');
    });

    it('affiche le bouton Delete pour un admin, sans bouton de participation', async () => {
      await openDetail(adminSession);

      expect(app.byText('button', 'Delete').length).toBe(1);
      expect(app.byText('button', 'Participate').length).toBe(0);
    });

    it('masque Delete pour un utilisateur non admin', async () => {
      await openDetail(memberSession);

      expect(app.byText('button', 'Delete').length).toBe(0);
      expect(app.byText('button', 'Participate').length).toBe(1);
    });

    it('inscrit l\'utilisateur à la session puis recharge les informations', async () => {
      await openDetail(memberSession);

      await app.clickText('button', 'Participate');
      await app.respond('POST', 'api/session/1/participate/5');
      await app.respond('GET', 'api/session/1', makeSession({ users: [7, 8, 5] }));
      await app.respond('GET', 'api/teacher/2', teachers[1]);

      expect(app.text).toContain('3 attendees');
      expect(app.byText('button', 'Do not participate').length).toBe(1);
    });

    it('désinscrit l\'utilisateur de la session puis recharge les informations', async () => {
      await openDetail(memberSession, [5]);
      expect(app.byText('button', 'Do not participate').length).toBe(1);

      await app.clickText('button', 'Do not participate');
      await app.respond('DELETE', 'api/session/1/participate/5');
      await app.respond('GET', 'api/session/1', makeSession({ users: [] }));
      await app.respond('GET', 'api/teacher/2', teachers[1]);

      expect(app.text).toContain('0 attendees');
      expect(app.byText('button', 'Participate').length).toBe(1);
    });

    it('supprime la session, prévient l\'utilisateur et revient à la liste', async () => {
      await openDetail(adminSession);

      await app.clickText('button', 'Delete');
      await app.respond('DELETE', 'api/session/1');

      expect(app.snackBar.open).toHaveBeenCalledWith('Session deleted !', 'Close', { duration: 3000 });
      expect(app.url).toBe('/sessions');
      await app.respond('GET', 'api/session', []);
    });
  });

  describe('Création', () => {
    const openCreate = async (): Promise<void> => {
      app = await AppHarness.start(adminSession);
      await app.navigate('/sessions/create');
      await app.respond('GET', 'api/teacher', teachers);
    };

    it('propose les professeurs dans la liste déroulante', async () => {
      await openCreate();

      await app.click(app.element.querySelector<HTMLElement>('mat-select') ?? undefined);

      const options = Array.from(document.querySelectorAll('mat-option')).map(o => o.textContent?.trim());
      expect(options).toEqual(['Margot DELAHAYE', 'Helene THIERCELIN']);
    });

    it('crée la session avec les valeurs saisies puis revient à la liste', async () => {
      await openCreate();
      await app.type('input[formControlName="name"]', 'Yoga du soir');
      await app.type('input[formControlName="date"]', '2026-03-01');
      await app.selectOption('Margot DELAHAYE');
      await app.type('textarea[formControlName="description"]', 'Détente profonde');

      await app.submit();
      const request = app.expectRequest('POST', 'api/session');
      expect(request.request.body).toEqual({
        name: 'Yoga du soir',
        date: '2026-03-01',
        teacher_id: 1,
        description: 'Détente profonde'
      });
      request.flush(makeSession());
      await app.settle();

      expect(app.snackBar.open).toHaveBeenCalledWith('Session created !', 'Close', { duration: 3000 });
      expect(app.url).toBe('/sessions');
      await app.respond('GET', 'api/session', []);
    });

    it('désactive Save et n\'envoie rien quand un champ obligatoire est manquant', async () => {
      await openCreate();
      await app.type('input[formControlName="name"]', 'Yoga du soir');

      expect(app.submitButton().disabled).toBe(true);
      app.http.expectNone('api/session');
    });

    it('revient à la liste avec le bouton retour', async () => {
      await openCreate();

      await app.click(app.byText('button', 'arrow_back')[0]);

      expect(app.url).toBe('/sessions');
      await app.respond('GET', 'api/session', []);
    });

    it('redirige un utilisateur non admin vers la liste', async () => {
      app = await AppHarness.start(memberSession);

      await app.navigate('/sessions/create');

      expect(app.url).toBe('/sessions');
      // Le formulaire s'est monté un instant et a demandé les professeurs : la requête est annulée à la redirection
      expect(app.http.match('api/teacher').every(request => request.cancelled)).toBe(true);
      await app.respond('GET', 'api/session', []);
    });
  });

  describe('Modification', () => {
    const openUpdate = async (): Promise<void> => {
      app = await AppHarness.start(adminSession);
      await app.navigate('/sessions/update/1');
      await app.respond('GET', 'api/session/1', makeSession());
      await app.respond('GET', 'api/teacher', teachers);
    };

    it('pré-remplit le formulaire avec la session existante', async () => {
      await openUpdate();

      const name = app.element.querySelector<HTMLInputElement>('input[formControlName="name"]');
      const date = app.element.querySelector<HTMLInputElement>('input[formControlName="date"]');
      expect(name?.value).toBe('morning flow');
      expect(date?.value).toBe('2026-01-01');
      expect(app.submitButton().disabled).toBe(false);
    });

    it('modifie la session puis revient à la liste', async () => {
      await openUpdate();
      await app.type('input[formControlName="name"]', 'Renamed');

      await app.submit();
      const request = app.expectRequest('PUT', 'api/session/1');
      expect(request.request.body).toEqual({
        name: 'Renamed',
        date: '2026-01-01',
        teacher_id: 2,
        description: 'Relax and breathe'
      });
      request.flush(makeSession({ name: 'Renamed' }));
      await app.settle();

      expect(app.snackBar.open).toHaveBeenCalledWith('Session updated !', 'Close', { duration: 3000 });
      expect(app.url).toBe('/sessions');
      await app.respond('GET', 'api/session', []);
    });

    it('désactive Save quand on vide un champ obligatoire', async () => {
      await openUpdate();

      await app.type('input[formControlName="name"]', '');

      expect(app.submitButton().disabled).toBe(true);
      app.http.expectNone('api/session/1');
    });
  });
});
