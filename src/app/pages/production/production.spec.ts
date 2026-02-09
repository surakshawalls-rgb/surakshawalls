import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductionComponent } from './production';

describe('Production', () => {
  let component: ProductionComponent;
  let fixture: ComponentFixture<ProductionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductionComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
