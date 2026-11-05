import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, beforeEach, it, expect } from '@jest/globals';
import { NotFoundComponent } from './not-found.component';

describe('NotFoundComponent (unitaire)', () => {
  let fixture: ComponentFixture<NotFoundComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [NotFoundComponent] }).compileComponents();
    fixture = TestBed.createComponent(NotFoundComponent);
    fixture.detectChanges();
  });

  it('affiche le message "Page not found !"', () => {
    expect(fixture.nativeElement.querySelector('h1').textContent).toContain('Page not found !');
  });
});
