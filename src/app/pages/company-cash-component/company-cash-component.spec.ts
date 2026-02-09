import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CompanyCashComponent } from './company-cash-component';

describe('CompanyCashComponent', () => {
  let component: CompanyCashComponent;
  let fixture: ComponentFixture<CompanyCashComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CompanyCashComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CompanyCashComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
