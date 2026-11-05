describe('Login', () => {
  beforeEach(() => {
    cy.stubApi();
    cy.visit('/login');
  });

  it('affiche le formulaire avec le bouton Submit désactivé', () => {
    cy.contains('mat-card-title', 'Login').should('be.visible');
    cy.get('input[formControlName=email]').should('be.visible');
    cy.get('input[formControlName=password]').should('be.visible');
    cy.get('button[type=submit]').should('be.disabled');
  });

  it('désactive Submit quand le mot de passe est manquant', () => {
    cy.get('input[formControlName=email]').type('yoga@studio.com');

    cy.get('button[type=submit]').should('be.disabled');
  });

  it('désactive Submit quand l\'email est manquant', () => {
    cy.get('input[formControlName=password]').type('test!1234');

    cy.get('button[type=submit]').should('be.disabled');
  });

  it('désactive Submit quand l\'email est invalide', () => {
    cy.get('input[formControlName=email]').type('pas-un-email');
    cy.get('input[formControlName=password]').type('test!1234');

    cy.get('button[type=submit]').should('be.disabled');
  });

  it('connecte un utilisateur et ouvre la liste des sessions', () => {
    cy.intercept('POST', '/api/auth/login', { fixture: 'member-session.json' }).as('login');

    cy.get('input[formControlName=email]').type('john@doe.com');
    cy.get('input[formControlName=password]').type('test!1234');
    cy.get('button[type=submit]').click();

    cy.wait('@login').its('request.body').should('deep.equal', { email: 'john@doe.com', password: 'test!1234' });
    cy.url().should('include', '/sessions');
    cy.contains('.link', 'Logout').should('be.visible');
  });

  it('envoie le jeton de l\'utilisateur dans les requêtes suivantes', () => {
    cy.loginAs('member');

    cy.wait('@sessions').its('request.headers.authorization').should('eq', 'Bearer jwt-member');
  });

  it('affiche une erreur quand le mot de passe est faux et reste sur la page', () => {
    cy.intercept('POST', '/api/auth/login', { statusCode: 401, body: { message: 'Unauthorized' } }).as('login');

    cy.get('input[formControlName=email]').type('yoga@studio.com');
    cy.get('input[formControlName=password]').type('mauvais');
    cy.get('button[type=submit]').click();

    cy.wait('@login');
    cy.contains('.error', 'An error occurred').should('be.visible');
    cy.url().should('include', '/login');
  });

  it('masque puis affiche le mot de passe avec le bouton œil', () => {
    cy.get('input[formControlName=password]').should('have.attr', 'type', 'password');

    cy.get('button[matSuffix]').click();
    cy.get('input[formControlName=password]').should('have.attr', 'type', 'text');

    cy.get('button[matSuffix]').click();
    cy.get('input[formControlName=password]').should('have.attr', 'type', 'password');
  });

  it('redirige un utilisateur déjà connecté vers la liste des sessions', () => {
    cy.loginAs('member');

    cy.navigateInApp('/login');

    cy.url().should('include', '/sessions');
  });
});
