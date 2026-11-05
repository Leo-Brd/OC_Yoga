describe('Modification d\'une session', () => {
  beforeEach(() => {
    cy.stubApi();
    cy.loginAs('admin');
    cy.contains('mat-card.item', 'morning flow').contains('button', 'Edit').click();
    cy.wait('@sessionDetail');
    cy.wait('@teachers');
  });

  it('pré-remplit le formulaire avec la session existante', () => {
    cy.contains('h1', 'Update session').should('be.visible');
    cy.get('input[formControlName=name]').should('have.value', 'morning flow');
    cy.get('input[formControlName=date]').should('have.value', '2026-01-15');
    cy.get('textarea[formControlName=description]').should('have.value', 'Relax and breathe');
    cy.get('mat-select').should('contain', 'Helene THIERCELIN');
    cy.get('button[type=submit]').should('be.enabled');
  });

  it('modifie la session, affiche un message et revient à la liste', () => {
    cy.intercept('PUT', '/api/session/1', { statusCode: 200, fixture: 'session.json' }).as('update');

    cy.get('input[formControlName=name]').clear().type('Renamed flow');
    cy.get('button[type=submit]').click();

    cy.wait('@update').its('request.body').should('deep.equal', {
      name: 'Renamed flow',
      date: '2026-01-15',
      teacher_id: 2,
      description: 'Relax and breathe'
    });
    cy.contains('Session updated !').should('be.visible');
    cy.url().should('match', /\/sessions$/);
  });

  it('désactive Save quand le nom est vidé', () => {
    cy.get('input[formControlName=name]').clear();

    cy.get('button[type=submit]').should('be.disabled');
  });

  it('désactive Save quand la description est vidée', () => {
    cy.get('textarea[formControlName=description]').clear();

    cy.get('button[type=submit]').should('be.disabled');
  });

  it('désactive Save quand la date est effacée', () => {
    cy.get('input[formControlName=date]').clear();

    cy.get('button[type=submit]').should('be.disabled');
  });
});
