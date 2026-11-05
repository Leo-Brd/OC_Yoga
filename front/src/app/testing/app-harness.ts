import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, TestRequest, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Router, provideRouter } from '@angular/router';
import { jest } from '@jest/globals';
import { AppComponent } from '../app.component';
import { routes } from '../app.routes';
import { Session } from '../core/models/session.interface';
import { SessionInformation } from '../core/models/sessionInformation.interface';
import { Teacher } from '../core/models/teacher.interface';
import { User } from '../core/models/user.interface';
import { SessionService } from '../core/service/session.service';
import { customJwtInterceptorFn } from '../interceptors/customJwtInterceptorFn';

export const adminSession: SessionInformation = {
  token: 'jwt-admin',
  type: 'Bearer',
  id: 1,
  username: 'yoga@studio.com',
  firstName: 'Admin',
  lastName: 'Admin',
  admin: true
};

export const memberSession: SessionInformation = {
  token: 'jwt-member',
  type: 'Bearer',
  id: 5,
  username: 'john@doe.com',
  firstName: 'John',
  lastName: 'Doe',
  admin: false
};

export const teachers: Teacher[] = [
  { id: 1, firstName: 'Margot', lastName: 'DELAHAYE', createdAt: new Date('2026-01-01'), updatedAt: new Date('2026-01-01') },
  { id: 2, firstName: 'Helene', lastName: 'THIERCELIN', createdAt: new Date('2026-01-01'), updatedAt: new Date('2026-01-01') }
];

export const makeSession = (overrides: Partial<Session> = {}): Session => ({
  id: 1,
  name: 'morning flow',
  description: 'Relax and breathe',
  date: new Date('2026-01-01'),
  teacher_id: 2,
  users: [7, 8],
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-02'),
  ...overrides
});

export const makeUser = (overrides: Partial<User> = {}): User => ({
  id: 5,
  email: 'john@doe.com',
  firstName: 'John',
  lastName: 'Doe',
  admin: false,
  password: '',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-02-01'),
  ...overrides
});

/**
 * Monte l'application complète (vraies routes, vrais guards, vrais services, vrai intercepteur JWT).
 * Seuls le réseau (HttpTestingController) et la snackbar sont simulés.
 */
export class AppHarness {
  private constructor(
    readonly fixture: ComponentFixture<AppComponent>,
    readonly http: HttpTestingController,
    readonly router: Router,
    readonly sessionService: SessionService,
    readonly snackBar: { open: jest.Mock }
  ) {}

  static async start(user?: SessionInformation): Promise<AppHarness> {
    const snackBar = { open: jest.fn() };
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideNoopAnimations(),
        provideRouter(routes),
        provideHttpClient(withInterceptors([customJwtInterceptorFn])),
        provideHttpClientTesting()
      ]
    })
      .overrideProvider(MatSnackBar, { useValue: snackBar })
      .compileComponents();

    const fixture = TestBed.createComponent(AppComponent);
    const harness = new AppHarness(
      fixture,
      TestBed.inject(HttpTestingController),
      TestBed.inject(Router),
      TestBed.inject(SessionService),
      snackBar
    );
    if (user) {
      harness.sessionService.logIn(user);
    }
    fixture.detectChanges();
    return harness;
  }

  get element(): HTMLElement {
    return this.fixture.nativeElement;
  }

  get text(): string {
    return this.element.textContent ?? '';
  }

  get url(): string {
    return this.router.url;
  }

  async settle(): Promise<void> {
    this.fixture.detectChanges();
    await this.fixture.whenStable();
    this.fixture.detectChanges();
  }

  async navigate(url: string): Promise<void> {
    await this.router.navigateByUrl(url);
    await this.settle();
  }

  expectRequest(method: string, url: string): TestRequest {
    return this.http.expectOne(request => request.method === method && request.urlWithParams === url);
  }

  async respond(method: string, url: string, body: object | null = null): Promise<TestRequest> {
    const request = this.expectRequest(method, url);
    request.flush(body);
    await this.settle();
    return request;
  }

  async respondError(method: string, url: string, status: number): Promise<void> {
    this.expectRequest(method, url).flush(null, { status, statusText: 'Error' });
    await this.settle();
  }

  all(selector: string): HTMLElement[] {
    return Array.from(this.element.querySelectorAll<HTMLElement>(selector));
  }

  byText(selector: string, label: string): HTMLElement[] {
    return this.all(selector).filter(element => (element.textContent ?? '').includes(label));
  }

  async click(element: HTMLElement | undefined): Promise<void> {
    if (!element) {
      throw new Error('Élément à cliquer introuvable');
    }
    element.click();
    await this.settle();
  }

  async clickText(selector: string, label: string): Promise<void> {
    await this.click(this.byText(selector, label)[0]);
  }

  async type(selector: string, value: string): Promise<void> {
    const input = this.element.querySelector<HTMLInputElement | HTMLTextAreaElement>(selector);
    if (!input) {
      throw new Error(`Champ introuvable : ${selector}`);
    }
    input.value = value;
    input.dispatchEvent(new Event('input'));
    await this.settle();
  }

  async submit(): Promise<void> {
    this.element.querySelector('form')?.dispatchEvent(new Event('submit'));
    await this.settle();
  }

  submitButton(): HTMLButtonElement {
    return this.element.querySelector('button[type="submit"]') as HTMLButtonElement;
  }

  async selectOption(label: string): Promise<void> {
    await this.click(this.element.querySelector<HTMLElement>('mat-select') ?? undefined);
    const option = Array.from(document.querySelectorAll<HTMLElement>('mat-option')).find(o =>
      (o.textContent ?? '').includes(label)
    );
    await this.click(option);
  }
}
