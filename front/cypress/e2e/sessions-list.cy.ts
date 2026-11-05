describe('Liste des sessions', () => {
  beforeEach(() => {
    cy.stubApi();
  });

  it('affiche la liste des sessions', () => {
    cy.loginAs('member');

    cy.get('mat-card.item').should('have.length', 2);
    cy.contains('mat-card.item', 'morning flow').should('contain', 'Relax and breathe');
    cy.contains('mat-card.item', 'evening stretch').should('contain', 'Unwind after work');
  });

  it('n\'affiche aucune carte quand il n\'y a pas de session', () => {
    cy.intercept('GET', '/api/session', []).as('emptySessions');
    cy.loginAs('member');

    cy.contains('mat-card-title', 'Rentals available').should('be.visible');
    cy.get('mat-card.item').should('not.exist');
  });

  it('affiche uniquement Detail pour un utilisateur non admin', () => {
    cy.loginAs('member');

    cy.contains('button', 'Detail').should('be.visible');
    cy.contains('button', 'Create').should('not.exist');
    cy.contains('button', 'Edit').should('not.exist');
  });

  it('affiche Create, Detail et Edit pour un admin', () => {
    cy.loginAs('admin');

    cy.contains('button', 'Create').should('be.visible');
    cy.get('mat-card.item').each(card => {
      cy.wrap(card).contains('button', 'Detail').should('be.visible');
      cy.wrap(card).contains('button', 'Edit').should('be.visible');
    });
  });

  it('ouvre le détail d\'une session avec le bouton Detail', () => {
    cy.loginAs('member');

    cy.contains('mat-card.item', 'morning flow').contains('button', 'Detail').click();

    cy.url().should('include', '/sessions/detail/1');
    cy.contains('h1', 'Morning Flow').should('be.visible');
  });

  it('ouvre le formulaire de création avec le bouton Create', () => {
    cy.loginAs('admin');

    cy.contains('button', 'Create').click();

    cy.url().should('include', '/sessions/create');
    cy.contains('h1', 'Create session').should('be.visible');
  });

  it('ouvre le formulaire de modification avec le bouton Edit', () => {
    cy.loginAs('admin');

    cy.contains('mat-card.item', 'morning flow').contains('button', 'Edit').click();

    cy.url().should('include', '/sessions/update/1');
    cy.contains('h1', 'Update session').should('be.visible');
  });
});
