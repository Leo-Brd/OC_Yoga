describe('Navigation et déconnexion', () => {
  beforeEach(() => {
    cy.stubApi();
  });

  it('redirige la racine vers la page de connexion', () => {
    cy.visit('/');

    cy.url().should('include', '/login');
  });

  it('affiche Login et Register à un visiteur non connecté', () => {
    cy.visit('/login');

    cy.contains('.link', 'Login').should('be.visible');
    cy.contains('.link', 'Register').should('be.visible');
    cy.contains('.link', 'Logout').should('not.exist');
  });

  it('ouvre la page d\'inscription depuis le lien Register', () => {
    cy.visit('/login');

    cy.contains('.link', 'Register').click();

    cy.url().should('include', '/register');
  });

  it('affiche Sessions, Account et Logout à un utilisateur connecté', () => {
    cy.loginAs('member');

    cy.contains('.link', 'Sessions').should('be.visible');
    cy.contains('.link', 'Account').should('be.visible');
    cy.contains('.link', 'Logout').should('be.visible');
    cy.contains('.link', 'Login').should('not.exist');
  });

  it('revient à la liste avec le lien Sessions', () => {
    cy.loginAs('member');
    cy.contains('.link', 'Account').click();

    cy.contains('.link', 'Sessions').click();

    cy.url().should('match', /\/sessions$/);
    cy.get('mat-card.item').should('have.length', 2);
  });

  it('déconnecte l\'utilisateur avec Logout', () => {
    cy.loginAs('member');

    cy.contains('.link', 'Logout').click();

    cy.url().should('include', '/login');
    cy.contains('.link', 'Login').should('be.visible');
    cy.contains('.link', 'Logout').should('not.exist');
  });

  it('bloque l\'accès aux pages protégées après la déconnexion', () => {
    cy.loginAs('member');
    cy.contains('.link', 'Logout').click();

    cy.navigateInApp('/sessions');

    cy.url().should('include', '/login');
  });

  it('redirige un visiteur non connecté des pages protégées vers la connexion', () => {
    cy.visit('/sessions');
    cy.url().should('include', '/login');

    cy.visit('/me');
    cy.url().should('include', '/login');
  });

  it('affiche la page 404 pour une adresse inconnue', () => {
    cy.visit('/page-inexistante');

    cy.url().should('include', '/404');
    cy.contains('Page not found !').should('be.visible');
  });
});
