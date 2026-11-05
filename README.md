# Yoga App

Application de réservation de sessions de yoga : un **front Angular 19** (`front/`) et un **back Spring Boot 3 / Java 21** (`back/`) avec une base MySQL.

- [Prérequis](#prérequis)
- [Installation](#installation)
- [Lancer l'application](#lancer-lapplication)
- [Lancer les tests](#lancer-les-tests)
- [Couverture de code (seuil 80 %)](#couverture-de-code-seuil-80-)
- [Plan de testing couvert](#plan-de-testing-couvert)
- [Structure du dépôt](#structure-du-dépôt)
- [Limites connues](#limites-connues)

## Prérequis

| Outil | Version | Utilisé pour |
|---|---|---|
| JDK | **21** | back (compilation, tests) |
| Maven | 3.9+ | back |
| Node.js | 20 ou 22 LTS (Angular 19 ne déclare pas Node 24 comme supporté) | front |
| Docker Desktop | récent | **lancer** le back (base MySQL), pas nécessaire pour les tests |
| Google Chrome | récent | tests E2E Cypress |

## Installation

```bash
git clone <url-du-depot>
cd Yoga

# Front
cd front
npm install

# Back : les dépendances Maven sont téléchargées au premier build
cd ../back
mvn clean compile
```

> `npm install` fonctionne même avec `legacy-peer-deps=true` : `@angular/cli`, `@angular/compiler-cli` et `typescript` sont déclarés dans `front/package.json`.

## Lancer l'application

### 1. Le back (port 8080)

1. Démarrer **Docker Desktop** (attendre « Engine running »).
2. Dans `back/` :

   ```bash
   mvn spring-boot:run
   ```

   Spring Boot lance lui-même le conteneur MySQL décrit dans `back/compose.yaml` (la configuration de connexion est dans `back/.env`).

3. Créer les données de départ. La base démarre vide et **aucune route de l'API ne crée un professeur** : il faut les insérer à la main. Dans Docker Desktop, ouvrir le conteneur `back_mysql`, onglet **Exec**, puis :

   ```bash
   mysql -u user_test -p     # mot de passe : test_password
   ```

   ```sql
   use test;
   INSERT INTO users(first_name, last_name, admin, email, password)
     VALUES ('Admin', 'Admin', true, 'yoga@studio.com', '$2a$10$.Hsa/ZjUVaHqi0tp9xieMeewrnZxrZ5pQRzddUXE/WjDu2ZThe6Iq');
   INSERT INTO teachers(first_name, last_name, created_at, updated_at)
     VALUES ('Margot', 'DELAHAYE', NOW(), NOW()), ('Helene', 'THIERCELIN', NOW(), NOW());
   ```

   Compte administrateur créé : `yoga@studio.com` / `test!1234`.

### 2. Le front (port 4200)

```bash
cd front
npm run start
```

Ouvrir <http://localhost:4200>. Les appels `/api` sont redirigés vers `http://localhost:8080` (`front/proxy.conf.json`).

- Un compte créé avec **Register** est un utilisateur simple : il ne voit pas les boutons *Create*, *Edit* et *Delete*.
- Pour créer, modifier ou supprimer une session, se connecter avec le compte administrateur.

## Lancer les tests

Aucun test ne nécessite le back, Docker ou une vraie base de données.

### Front : tests unitaires et d'intégration (Jest)

```bash
cd front
npm test                  # lance les tests
npm run test:coverage     # lance les tests + couverture (échoue si un indicateur < 80 %)
npx jest login            # un seul fichier
```

- **118 tests**, dont **41 d'intégration (34,7 %)**.
- *Unitaires* (`*.spec.ts` à côté du code) : services, guards, intercepteur et chaque composant avec ses dépendances simulées.
- *Intégration* (`front/src/app/integration/`) : l'application complète est montée avec les vraies routes, les vrais guards, services et intercepteur JWT ; seul le réseau est simulé (`HttpTestingController`).

### Front : tests de bout en bout (Cypress)

```bash
cd front
npm run e2e:ci            # mode headless (Chrome) sur un build instrumenté
npm run e2e:coverage      # rapport de couverture + vérification du seuil de 80 %
npm run e2e               # mode interactif
```

- **60 tests** répartis en 8 fichiers dans `front/cypress/e2e/` (un par écran ou fonctionnalité).
- Les appels `/api/...` sont simulés avec `cy.intercept` à partir des jeux de données de `front/cypress/fixtures/` : le front est testé de bout en bout, sans le back.
- `npm run e2e:ci` efface d'abord `front/.nyc_output` : la couverture ne mélange jamais plusieurs exécutions.

### Back : tests unitaires et d'intégration (JUnit 5, Mockito, Spring Boot Test)

```bash
cd back
mvn clean verify                       # tests + rapport + vérification des seuils JaCoCo
mvn test                               # tests seulement
mvn test -Dtest=SessionServiceTest     # une seule classe
```

- **125 tests**, dont **51 d'intégration (40,8 %)**.
- *Unitaires* (74) : services, `GlobalExceptionHandler`, JWT (`JwtUtils`, `AuthTokenFilter`), `UserDetails`, mappers, classe principale. Repositories et collaborateurs simulés avec Mockito.
- *Intégration* (51, `*IntegrationTest`) : `@SpringBootTest` + MockMvc sur une base **H2 en mémoire** (profil `test`, `src/test/resources/application-test.yml`), avec la vraie sécurité JWT. Chaque test est annulé en fin d'exécution.

## Couverture de code (seuil 80 %)

Le seuil de **80 % s'applique à chaque indicateur, sur chacune des trois parties**, et fait **échouer la commande** s'il n'est pas atteint.

| Partie | Instructions | Branches | Fonctions / méthodes | Lignes | Autres | Contrôle du seuil |
|---|---|---|---|---|---|---|
| Front, Jest | 100 % | 100 % | 100 % | 100 % | — | `coverageThreshold` dans `front/jest.config.js` |
| Front, Cypress (E2E) | 100 % | 100 % | 100 % | 100 % | — | `front/.nycrc.json` (`npm run e2e:coverage`) |
| Back, JUnit/Mockito | 100 % | 100 % | 100 % | 100 % | complexité 100 %, classes 100 % | `jacoco:check` dans `back/pom.xml` (`mvn verify`) |

### Rapports générés

Les rapports HTML sont fournis dans [`reports/`](reports) (ouvrir le fichier `index.html` dans un navigateur) :

| Rapport | Fichier |
|---|---|
| Front, Jest | [`reports/front-jest/index.html`](reports/front-jest/index.html) |
| Front, Cypress | [`reports/front-e2e/index.html`](reports/front-e2e/index.html) |
| Back, JaCoCo | [`reports/back-jacoco/index.html`](reports/back-jacoco/index.html) |

Ils sont régénérés à chaque exécution à leur emplacement d'origine : `front/coverage/jest/lcov-report`, `front/coverage/lcov-report` et `back/target/site/jacoco`.

### Ce qui est inclus ou exclu de la couverture

- **Front** : tout `src/app`, sauf les `*.spec.ts`, les `*.interface.ts` (types sans code) et `src/app/testing/` (utilitaire de test).
- **Back** : tout `com.openclassrooms.starterjwt`, **sauf le package `dto`** (exclu volontairement, voir `back/pom.xml`). `back/lombok.config` marque le code généré par Lombok (getters, `equals`, builders) comme `@Generated`, donc JaCoCo l'ignore.

## Plan de testing couvert

| Fonctionnalité | Cas testés | Où |
|---|---|---|
| **Login** | connexion, mauvais mot de passe, champ obligatoire manquant | Jest (`login.component.spec.ts`, `auth.integration.spec.ts`), Cypress (`login.cy.ts`), back (`AuthControllerIntegrationTest`) |
| **Register** | création de compte, champ obligatoire manquant, email déjà pris | Jest (`register.component.spec.ts`, `auth.integration.spec.ts`), Cypress (`register.cy.ts`), back (`AuthControllerIntegrationTest`) |
| **Sessions (liste)** | affichage, boutons Create/Detail/Edit selon le rôle | Jest (`list.component.spec.ts`, `sessions.integration.spec.ts`), Cypress (`sessions-list.cy.ts`), back (`SessionControllerIntegrationTest`) |
| **Informations session** | affichage, bouton Delete pour un admin, participation | Jest (`detail.component.spec.ts`), Cypress (`session-detail.cy.ts`), back |
| **Création session** | création, champ obligatoire manquant | Jest (`form.component.spec.ts`), Cypress (`session-create.cy.ts`), back |
| **Suppression session** | suppression correcte | Jest, Cypress (`session-detail.cy.ts`), back |
| **Modification session** | modification, champ obligatoire manquant | Jest, Cypress (`session-update.cy.ts`), back |
| **Account** | affichage, suppression du compte | Jest (`me.component.spec.ts`, `account.integration.spec.ts`), Cypress (`account.cy.ts`), back (`UserControllerIntegrationTest`) |
| **Logout** | déconnexion, pages protégées inaccessibles ensuite | Jest (`app.component.spec.ts`, `auth.integration.spec.ts`), Cypress (`navigation.cy.ts`) |
| **Sécurité JWT** | jeton absent, mal formé, expiré, autre clé, utilisateur supprimé | back (`SecurityIntegrationTest`, `JwtUtilsTest`, `AuthTokenFilterTest`) |

## Structure du dépôt

```
Yoga/
├── back/                       Spring Boot
│   ├── src/main/java/...       controllers, services, repository, security, mapper, exception, dto
│   ├── src/test/java/...       tests unitaires + integration/ (tests d'intégration)
│   ├── src/test/resources/     application-test.yml (H2)
│   └── pom.xml                 JaCoCo (rapport + seuils)
├── front/                      Angular
│   ├── src/app/                code + *.spec.ts (unitaires) + integration/ + testing/
│   ├── cypress/                e2e/ (tests), fixtures/ (données), support/ (commandes)
│   ├── jest.config.js          Jest + seuil de couverture
│   └── .nycrc.json             couverture E2E + seuil
└── reports/                    rapports de couverture (HTML)
```

## Limites connues

- **Un professeur ne peut animer qu'une seule session.** `Session.teacher` est mappé en `@OneToOne`, ce qui crée une contrainte d'unicité sur `sessions.teacher_id` : créer une 2ᵉ session avec le même professeur échoue. Les tests utilisent des professeurs différents pour ne pas le déclencher.
- **Aucune route pour créer un professeur** : les insérer en base, voir [Lancer le back](#1-le-back-port-8080).
- **`back/.env` est suivi par git.** Il ne contient que des valeurs de développement, mais il faut le retirer du dépôt avant une mise en production.
- Les tests E2E simulent l'API : ils ne vérifient pas l'accord entre le front et le vrai back.
