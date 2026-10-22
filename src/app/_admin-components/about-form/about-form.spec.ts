import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AboutForm } from './about-form';

describe('AboutForm', () => {
  let component: AboutForm;
  let fixture: ComponentFixture<AboutForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AboutForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AboutForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
