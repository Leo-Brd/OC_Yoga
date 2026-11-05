describe('Account', () => {
  beforeEach(() => {
    cy.stubApi();
  });

  it('affiche les informations de l\'utilisateur', () => {
    cy.loginAs('member');

    cy.contains('.link', 'Account').click();

    cy.wait('@user');
    cy.url().should('include', '/me');
    cy.contains('User information').should('be.visible');
    cy.contains('Name: John DOE').should('be.visible');
    cy.contains('Email: john@doe.com').should('be.visible');
    cy.contains('Create at:').should('be.visible');
    cy.contains('Last update:').should('be.visible');
  });

  it('propose la suppression du compte à un utilisateur non admin', () => {
    cy.loginAs('member');

    cy.contains('.link', 'Account').click();

    cy.contains('Delete my account:').should('be.visible');
    cy.contains('You are admin').should('not.exist');
  });

  it('indique "You are admin" sans proposer la suppression pour un admin', () => {
    cy.loginAs('admin');

    cy.contains('.link', 'Account').click();

    cy.wait('@adminUser');
    cy.contains('You are admin').should('be.visible');
    cy.contains('Delete my account:').should('not.exist');
  });

  it('supprime le compte, affiche un message et revient à la connexion', () => {
    cy.intercept('DELETE', '/api/user/5', { statusCode: 200 }).as('deleteAccount');
    cy.loginAs('member');
    cy.contains('.link', 'Account').click();

    cy.contains('button', 'delete').click();

    cy.wait('@deleteAccount');
    cy.contains('Your account has been deleted !').should('be.visible');
    cy.url().should('include', '/login');
    cy.contains('.link', 'Logout').should('not.exist');
  });

  it('revient à la page précédente avec le bouton retour', () => {
    cy.loginAs('member');
    cy.contains('.link', 'Account').click();

    cy.contains('button', 'arrow_back').click();

    cy.url().should('match', /\/sessions$/);
  });
});
