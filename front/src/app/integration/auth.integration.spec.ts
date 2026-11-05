import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';
import { AppHarness, adminSession, makeSession } from '../testing/app-harness';

describe('Authentification (intégration)', () => {
  let app: AppHarness;

  afterEach(() => {
    app.http.verify();
  });

  describe('Login', () => {
    beforeEach(async () => {
      app = await AppHarness.start();
      await app.navigate('/login');
    });

    const fillLogin = async (email: string, password: string): Promise<void> => {
      await app.type('input[formControlName="email"]', email);
      await app.type('input[formControlName="password"]', password);
    };

    it('affiche le formulaire de connexion avec Submit désactivé', () => {
      expect(app.url).toBe('/login');
      expect(app.text).toContain('Login');
      expect(app.submitButton().disabled).toBe(true);
    });

    it('n\'envoie aucune requête quand un champ obligatoire est manquant', async () => {
      await fillLogin('yoga@studio.com', '');

      expect(app.submitButton().disabled).toBe(true);
      app.http.expectNone('/api/auth/login');
    });

    it('connecte l\'utilisateur, ouvre /sessions et envoie le jeton aux requêtes suivantes', async () => {
      await fillLogin('yoga@studio.com', 'test!1234');

      await app.submit();
      const login = app.expectRequest('POST', '/api/auth/login');
      expect(login.request.body).toEqual({ email: 'yoga@studio.com', password: 'test!1234' });
      login.flush(adminSession);
      await app.settle();

      expect(app.url).toBe('/sessions');
      expect(app.sessionService.isLogged).toBe(true);
      const list = app.expectRequest('GET', 'api/session');
      expect(list.request.headers.get('Authorization')).toBe('Bearer jwt-admin');
      list.flush([]);
      await app.settle();
      expect(app.text).toContain('Logout');
    });

    it('affiche une erreur et reste sur /login quand le mot de passe est faux', async () => {
      await fillLogin('yoga@studio.com', 'mauvais');

      await app.submit();
      await app.respondError('POST', '/api/auth/login', 401);

      expect(app.text).toContain('An error occurred');
      expect(app.url).toBe('/login');
      expect(app.sessionService.isLogged).toBe(false);
    });
  });

  describe('Register', () => {
    beforeEach(async () => {
      app = await AppHarness.start();
      await app.navigate('/register');
    });

    const fillRegister = async (values: Record<string, string>): Promise<void> => {
      for (const [name, value] of Object.entries(values)) {
        await app.type(`input[formControlName="${name}"]`, value);
      }
    };
    const valid = { firstName: 'John', lastName: 'Doe', email: 'john@doe.com', password: 'secret123' };

    it('crée le compte et redirige vers /login', async () => {
      await fillRegister(valid);

      await app.submit();
      const register = app.expectRequest('POST', '/api/auth/register');
      expect(register.request.body).toEqual(valid);
      register.flush(null);
      await app.settle();

      expect(app.url).toBe('/login');
    });

    it('affiche une erreur et reste sur /register quand l\'email est déjà pris', async () => {
      await fillRegister(valid);

      await app.submit();
      await app.respondError('POST', '/api/auth/register', 400);

      expect(app.text).toContain('An error occurred');
      expect(app.url).toBe('/register');
    });

    it('n\'envoie aucune requête quand un champ obligatoire est manquant', async () => {
      await fillRegister({ ...valid, lastName: '' });

      expect(app.submitButton().disabled).toBe(true);
      app.http.expectNone('/api/auth/register');
    });

    it('permet de se connecter juste après l\'inscription', async () => {
      await fillRegister(valid);
      await app.submit();
      await app.respond('POST', '/api/auth/register');
      expect(app.url).toBe('/login');

      await app.type('input[formControlName="email"]', valid.email);
      await app.type('input[formControlName="password"]', valid.password);
      await app.submit();
      await app.respond('POST', '/api/auth/login', { ...adminSession, admin: false, username: valid.email });

      expect(app.url).toBe('/sessions');
      await app.respond('GET', 'api/session', [makeSession()]);
      expect(app.text).toContain('morning flow');
    });
  });

  describe('Protection des pages', () => {
    it('redirige un visiteur non connecté de /sessions vers /login', async () => {
      app = await AppHarness.start();

      await app.navigate('/sessions');

      expect(app.url).toBe('/login');
    });

    it('redirige un utilisateur connecté de /login vers /sessions', async () => {
      app = await AppHarness.start(adminSession);

      await app.navigate('/login');

      expect(app.url).toBe('/sessions');
      await app.respond('GET', 'api/session', []);
    });

    it('redirige la racine vers /login', async () => {
      app = await AppHarness.start();

      await app.navigate('/');

      expect(app.url).toBe('/login');
    });
  });

  describe('Logout', () => {
    it('déconnecte l\'utilisateur, affiche Login/Register et bloque /sessions', async () => {
      app = await AppHarness.start(adminSession);
      await app.navigate('/sessions');
      await app.respond('GET', 'api/session', []);

      await app.clickText('.link', 'Logout');

      expect(app.sessionService.isLogged).toBe(false);
      expect(app.url).toBe('/login');
      expect(app.byText('.link', 'Login').length).toBe(1);
      expect(app.byText('.link', 'Register').length).toBe(1);
      await app.navigate('/sessions');
      expect(app.url).toBe('/login');
    });
  });
});
