import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PartnerComponent } from './partner';
import { provideRouter } from '@angular/router';
import { routes } from '../../app.routes';

describe('Partner', () => {
  let component: PartnerComponent;
  let fixture: ComponentFixture<PartnerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PartnerComponent],
      providers: [provideRouter(routes)]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PartnerComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
