import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClientMasterComponent } from './client-master-component';

describe('ClientMasterComponent', () => {
  let component: ClientMasterComponent;
  let fixture: ComponentFixture<ClientMasterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClientMasterComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClientMasterComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
