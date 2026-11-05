import { afterEach, describe, expect, it } from '@jest/globals';
import { AppHarness, adminSession, makeSession, makeUser, memberSession } from '../testing/app-harness';

describe('Compte et navigation (intégration)', () => {
  let app: AppHarness;

  afterEach(() => {
    app.http.verify();
  });

  describe('Account', () => {
    it('affiche les informations de l\'utilisateur connecté', async () => {
      app = await AppHarness.start(memberSession);
      await app.navigate('/me');

      const request = app.expectRequest('GET', 'api/user/5');
      expect(request.request.headers.get('Authorization')).toBe('Bearer jwt-member');
      request.flush(makeUser());
      await app.settle();

      expect(app.text).toContain('Name: John DOE');
      expect(app.text).toContain('Email: john@doe.com');
      expect(app.text).toContain('Delete my account:');
    });

    it('indique "You are admin" sans proposer la suppression pour un admin', async () => {
      app = await AppHarness.start(adminSession);
      await app.navigate('/me');
      await app.respond('GET', 'api/user/1', makeUser({ id: 1, admin: true, firstName: 'Admin', lastName: 'Admin' }));

      expect(app.text).toContain('You are admin');
      expect(app.text).not.toContain('Delete my account:');
    });

    it('supprime le compte, déconnecte l\'utilisateur et revient à la connexion', async () => {
      app = await AppHarness.start(memberSession);
      await app.navigate('/me');
      await app.respond('GET', 'api/user/5', makeUser());

      await app.click(app.byText('button', 'delete')[0]);
      await app.respond('DELETE', 'api/user/5');

      expect(app.snackBar.open).toHaveBeenCalledWith('Your account has been deleted !', 'Close', { duration: 3000 });
      expect(app.sessionService.isLogged).toBe(false);
      expect(app.url).toBe('/login');
    });

    it('s\'ouvre depuis le lien Account de la barre de navigation', async () => {
      app = await AppHarness.start(memberSession);
      await app.navigate('/sessions');
      await app.respond('GET', 'api/session', [makeSession()]);

      await app.clickText('.link', 'Account');
      expect(app.url).toBe('/me');
      await app.respond('GET', 'api/user/5', makeUser());

      expect(app.text).toContain('User information');
    });
  });

  describe('Navigation', () => {
    it('revient à la liste depuis le lien Sessions de la barre de navigation', async () => {
      app = await AppHarness.start(memberSession);
      await app.navigate('/me');
      await app.respond('GET', 'api/user/5', makeUser());

      await app.clickText('.link', 'Sessions');
      expect(app.url).toBe('/sessions');
      await app.respond('GET', 'api/session', [makeSession()]);

      expect(app.text).toContain('morning flow');
    });

    it('redirige une adresse inconnue vers la page 404', async () => {
      app = await AppHarness.start();

      await app.navigate('/page-inexistante');

      expect(app.url).toBe('/404');
      expect(app.text).toContain('Page not found !');
    });
  });
});
