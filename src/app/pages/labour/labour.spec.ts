import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LabourComponent } from './labour';

describe('Labour', () => {
  let component: LabourComponent;
  let fixture: ComponentFixture<LabourComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LabourComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LabourComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
