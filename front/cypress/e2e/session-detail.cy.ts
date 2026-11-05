const openDetail = (role: 'admin' | 'member'): void => {
  cy.loginAs(role);
  cy.contains('mat-card.item', 'morning flow').contains('button', 'Detail').click();
  cy.wait('@sessionDetail');
  cy.wait('@teacher');
};

describe('Détail d\'une session', () => {
  beforeEach(() => {
    cy.stubApi();
  });

  it('affiche les informations de la session et de son professeur', () => {
    openDetail('member');

    cy.contains('h1', 'Morning Flow').should('be.visible');
    cy.contains('2 attendees').should('be.visible');
    cy.contains('Relax and breathe').should('be.visible');
    cy.contains('Helene THIERCELIN').should('be.visible');
    cy.contains('January 15, 2026').should('be.visible');
  });

  it('affiche Delete et aucun bouton de participation pour un admin', () => {
    openDetail('admin');

    cy.contains('button', 'Delete').should('be.visible');
    cy.contains('button', 'Participate').should('not.exist');
    cy.contains('button', 'Do not participate').should('not.exist');
  });

  it('masque Delete et propose Participate pour un utilisateur non admin', () => {
    openDetail('member');

    cy.contains('button', 'Delete').should('not.exist');
    cy.contains('button', 'Participate').should('be.visible');
  });

  it('inscrit l\'utilisateur à la session', () => {
    cy.intercept('POST', '/api/session/1/participate/5', { statusCode: 200 }).as('participate');
    openDetail('member');
    cy.fixture('session.json').then(session => {
      cy.intercept('GET', '/api/session/1', { ...session, users: [...session.users, 5] }).as('refreshed');
    });

    cy.contains('button', 'Participate').click();

    cy.wait('@participate');
    cy.wait('@refreshed');
    cy.contains('3 attendees').should('be.visible');
    cy.contains('button', 'Do not participate').should('be.visible');
  });

  it('désinscrit l\'utilisateur de la session', () => {
    cy.intercept('DELETE', '/api/session/1/participate/5', { statusCode: 200 }).as('unparticipate');
    cy.fixture('session.json').then(session => {
      cy.intercept('GET', '/api/session/1', { ...session, users: [5] }).as('sessionDetail');
    });
    openDetail('member');
    cy.contains('button', 'Do not participate').should('be.visible');
    cy.fixture('session.json').then(session => {
      cy.intercept('GET', '/api/session/1', { ...session, users: [] }).as('refreshed');
    });

    cy.contains('button', 'Do not participate').click();

    cy.wait('@unparticipate');
    cy.wait('@refreshed');
    cy.contains('0 attendees').should('be.visible');
    cy.contains('button', 'Participate').should('be.visible');
  });

  it('supprime la session, affiche un message et revient à la liste', () => {
    cy.intercept('DELETE', '/api/session/1', { statusCode: 200 }).as('delete');
    openDetail('admin');

    cy.contains('button', 'Delete').click();

    cy.wait('@delete');
    cy.contains('Session deleted !').should('be.visible');
    cy.url().should('match', /\/sessions$/);
  });

  it('revient à la page précédente avec le bouton retour', () => {
    openDetail('member');

    cy.contains('button', 'arrow_back').click();

    cy.url().should('match', /\/sessions$/);
  });
});
