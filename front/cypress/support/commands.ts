type Role = 'admin' | 'member';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      /** Simule l'API du back (liste, détail, professeurs, utilisateur) avec les fixtures du dossier cypress/fixtures. */
      stubApi(): Chainable<void>;
      /** Se connecte par l'interface avec un compte admin ou un compte simple (réponse du login simulée). */
      loginAs(role: Role): Chainable<void>;
      /** Navigue dans l'application sans recharger la page (la session n'est gardée qu'en mémoire). */
      navigateInApp(path: string): Chainable<void>;
    }
  }
}

Cypress.Commands.add('stubApi', () => {
  cy.intercept('GET', '/api/session', { fixture: 'sessions.json' }).as('sessions');
  cy.intercept('GET', '/api/session/1', { fixture: 'session.json' }).as('sessionDetail');
  cy.intercept('GET', '/api/teacher', { fixture: 'teachers.json' }).as('teachers');
  cy.intercept('GET', '/api/teacher/2', { fixture: 'teacher.json' }).as('teacher');
  cy.intercept('GET', '/api/user/5', { fixture: 'user.json' }).as('user');
  cy.intercept('GET', '/api/user/1', { fixture: 'admin-user.json' }).as('adminUser');
});

Cypress.Commands.add('loginAs', (role: Role) => {
  cy.intercept('POST', '/api/auth/login', { fixture: `${role}-session.json` }).as('login');
  cy.visit('/login');
  cy.get('input[formControlName=email]').type('user@yoga.com');
  cy.get('input[formControlName=password]').type('test!1234');
  cy.get('button[type=submit]').click();
  cy.wait('@login');
  cy.url().should('include', '/sessions');
});

Cypress.Commands.add('navigateInApp', (path: string) => {
  cy.window().then(win => {
    win.history.pushState({}, '', path);
    win.dispatchEvent(new PopStateEvent('popstate', { state: {} }));
  });
});

export {};
