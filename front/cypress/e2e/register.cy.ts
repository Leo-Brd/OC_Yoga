const valid = { firstName: 'John', lastName: 'Doe', email: 'john@doe.com', password: 'secret123' };

const fill = (values: Record<string, string>): void => {
  Object.entries(values).forEach(([name, value]) => {
    if (value) {
      cy.get(`input[formControlName=${name}]`).type(value);
    }
  });
};

describe('Register', () => {
  beforeEach(() => {
    cy.stubApi();
    cy.visit('/register');
  });

  it('affiche le formulaire avec le bouton Submit désactivé', () => {
    cy.contains('mat-card-title', 'Register').should('be.visible');
    cy.get('button[type=submit]').should('be.disabled');
  });

  ['firstName', 'lastName', 'email', 'password'].forEach(missing => {
    it(`désactive Submit quand le champ obligatoire ${missing} est manquant`, () => {
      fill({ ...valid, [missing]: '' });

      cy.get('button[type=submit]').should('be.disabled');
    });
  });

  it('refuse un mot de passe de moins de 6 caractères', () => {
    fill({ ...valid, password: 'abc' });

    cy.get('button[type=submit]').should('be.disabled');
  });

  it('active Submit quand tous les champs sont valides', () => {
    fill(valid);

    cy.get('button[type=submit]').should('be.enabled');
  });

  it('crée le compte et redirige vers la page de connexion', () => {
    cy.intercept('POST', '/api/auth/register', { statusCode: 200, body: { message: 'User registered successfully!' } }).as(
      'register'
    );
    fill(valid);

    cy.get('button[type=submit]').click();

    cy.wait('@register').its('request.body').should('deep.equal', valid);
    cy.url().should('include', '/login');
  });

  it('affiche une erreur quand l\'email est déjà utilisé', () => {
    cy.intercept('POST', '/api/auth/register', {
      statusCode: 400,
      body: { message: 'Error: Email is already taken!' }
    }).as('register');
    fill(valid);

    cy.get('button[type=submit]').click();

    cy.wait('@register');
    cy.contains('.error', 'An error occurred').should('be.visible');
    cy.url().should('include', '/register');
  });
});
