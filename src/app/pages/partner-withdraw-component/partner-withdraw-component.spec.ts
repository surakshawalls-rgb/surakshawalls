import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PartnerWithdrawComponent } from './partner-withdraw-component';

describe('PartnerWithdrawComponent', () => {
  let component: PartnerWithdrawComponent;
  let fixture: ComponentFixture<PartnerWithdrawComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PartnerWithdrawComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PartnerWithdrawComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
