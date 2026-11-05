const fillForm = (): void => {
  cy.get('input[formControlName=name]').type('Yoga du soir');
  cy.get('input[formControlName=date]').type('2026-03-01');
  cy.get('mat-select').click();
  cy.contains('mat-option', 'Margot DELAHAYE').click();
  cy.get('textarea[formControlName=description]').type('Détente profonde');
};

describe('Création d\'une session', () => {
  beforeEach(() => {
    cy.stubApi();
    cy.loginAs('admin');
    cy.contains('button', 'Create').click();
    cy.wait('@teachers');
  });

  it('affiche le formulaire vide avec Save désactivé', () => {
    cy.contains('h1', 'Create session').should('be.visible');
    cy.get('input[formControlName=name]').should('have.value', '');
    cy.get('button[type=submit]').should('be.disabled');
  });

  it('propose les professeurs dans la liste déroulante', () => {
    cy.get('mat-select').click();

    cy.get('mat-option').should('have.length', 2);
    cy.contains('mat-option', 'Margot DELAHAYE').should('be.visible');
    cy.contains('mat-option', 'Helene THIERCELIN').should('be.visible');
  });

  it('crée la session, affiche un message et revient à la liste', () => {
    cy.intercept('POST', '/api/session', { statusCode: 200, fixture: 'session.json' }).as('create');
    fillForm();

    cy.get('button[type=submit]').should('be.enabled').click();

    cy.wait('@create').its('request.body').should('deep.equal', {
      name: 'Yoga du soir',
      date: '2026-03-01',
      teacher_id: 1,
      description: 'Détente profonde'
    });
    cy.contains('Session created !').should('be.visible');
    cy.url().should('match', /\/sessions$/);
  });

  it('désactive Save quand le nom est manquant', () => {
    cy.get('input[formControlName=date]').type('2026-03-01');
    cy.get('mat-select').click();
    cy.contains('mat-option', 'Margot DELAHAYE').click();
    cy.get('textarea[formControlName=description]').type('Détente profonde');

    cy.get('button[type=submit]').should('be.disabled');
  });

  it('désactive Save quand la date est manquante', () => {
    cy.get('input[formControlName=name]').type('Yoga du soir');
    cy.get('mat-select').click();
    cy.contains('mat-option', 'Margot DELAHAYE').click();
    cy.get('textarea[formControlName=description]').type('Détente profonde');

    cy.get('button[type=submit]').should('be.disabled');
  });

  it('désactive Save quand le professeur est manquant', () => {
    cy.get('input[formControlName=name]').type('Yoga du soir');
    cy.get('input[formControlName=date]').type('2026-03-01');
    cy.get('textarea[formControlName=description]').type('Détente profonde');

    cy.get('button[type=submit]').should('be.disabled');
  });

  it('désactive Save quand la description est manquante', () => {
    cy.get('input[formControlName=name]').type('Yoga du soir');
    cy.get('input[formControlName=date]').type('2026-03-01');
    cy.get('mat-select').click();
    cy.contains('mat-option', 'Margot DELAHAYE').click();

    cy.get('button[type=submit]').should('be.disabled');
  });

  it('revient à la liste avec le bouton retour', () => {
    cy.get('button[routerLink="/sessions"]').click();

    cy.url().should('match', /\/sessions$/);
  });
});

describe('Création : accès non admin', () => {
  it('redirige un utilisateur non admin vers la liste', () => {
    cy.stubApi();
    cy.loginAs('member');

    cy.navigateInApp('/sessions/create');

    cy.url().should('match', /\/sessions$/);
    cy.contains('h1', 'Create session').should('not.exist');
  });
});
