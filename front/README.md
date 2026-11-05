# Yoga : front

Front Angular 19 de l'application Yoga, généré avec [Angular CLI](https://github.com/angular/angular-cli) 19.2.16.

> Installation complète, lancement du back, couverture et rapports : voir le [README à la racine du dépôt](../README.md).

## Démarrer

```bash
npm install
npm run start      # http://localhost:4200 (le back doit tourner sur le port 8080)
```

## Tests

| Commande | Rôle |
|---|---|
| `npm test` | tests unitaires et d'intégration (Jest) |
| `npm run test:coverage` | idem + couverture ; échoue si un indicateur est sous 80 % |
| `npm run test:watch` | Jest en continu |
| `npm run e2e:ci` | tests E2E Cypress en headless (Chrome) sur un build instrumenté |
| `npm run e2e:coverage` | rapport de couverture E2E ; échoue si un indicateur est sous 80 % |
| `npm run e2e` | Cypress en mode interactif |

Rapports :

- Jest : `coverage/jest/lcov-report/index.html`
- Cypress : `coverage/lcov-report/index.html`

