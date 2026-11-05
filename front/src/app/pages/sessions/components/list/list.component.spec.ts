import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { describe, beforeEach, it, expect, jest } from '@jest/globals';
import { of } from 'rxjs';
import { Session } from '../../../../core/models/session.interface';
import { SessionApiService } from '../../../../core/service/session-api.service';
import { SessionService } from '../../../../core/service/session.service';
import { ListComponent } from './list.component';

describe('ListComponent (unitaire)', () => {
  let fixture: ComponentFixture<ListComponent>;

  const sessionApiService = { all: jest.fn() };
  const sessionService = { sessionInformation: { id: 1, admin: false } };

  const sessions: Session[] = [
    { id: 1, name: 'Morning flow', description: 'Relax', date: new Date('2026-01-01'), teacher_id: 1, users: [] },
    { id: 2, name: 'Evening stretch', description: 'Unwind', date: new Date('2026-02-01'), teacher_id: 2, users: [] }
  ];

  const buttonLabels = (): string[] =>
    (Array.from(fixture.nativeElement.querySelectorAll('button')) as HTMLButtonElement[]).map(
      b => b.textContent?.replace(/\s+/g, ' ').trim() ?? ''
    );

  const create = async (admin: boolean, list: Session[] = sessions): Promise<void> => {
    sessionService.sessionInformation = { id: 1, admin };
    sessionApiService.all.mockReturnValue(of(list));
    await TestBed.configureTestingModule({
      imports: [ListComponent],
      providers: [
        provideNoopAnimations(),
        provideRouter([]),
        { provide: SessionApiService, useValue: sessionApiService },
        { provide: SessionService, useValue: sessionService }
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(ListComponent);
    fixture.detectChanges();
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('affiche une carte par session avec son nom et sa description', async () => {
    await create(false);

    const cards = fixture.nativeElement.querySelectorAll('mat-card.item');
    expect(cards.length).toBe(2);
    expect(cards[0].textContent).toContain('Morning flow');
    expect(cards[0].textContent).toContain('Relax');
    expect(cards[1].textContent).toContain('Evening stretch');
  });

  it('n\'affiche aucune carte quand il n\'y a pas de session', async () => {
    await create(false, []);

    expect(fixture.nativeElement.querySelectorAll('mat-card.item').length).toBe(0);
  });

  it('affiche uniquement le bouton Detail pour un utilisateur non admin', async () => {
    await create(false);

    const labels = buttonLabels();
    expect(labels.filter(l => l.includes('Detail')).length).toBe(2);
    expect(labels.some(l => l.includes('Create'))).toBe(false);
    expect(labels.some(l => l.includes('Edit'))).toBe(false);
  });

  it('affiche Create et Edit en plus de Detail pour un admin', async () => {
    await create(true);

    const labels = buttonLabels();
    expect(labels.filter(l => l.includes('Create')).length).toBe(1);
    expect(labels.filter(l => l.includes('Edit')).length).toBe(2);
    expect(labels.filter(l => l.includes('Detail')).length).toBe(2);
  });
});
