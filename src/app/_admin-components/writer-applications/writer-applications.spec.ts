import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WriterApplications } from './writer-applications';

describe('WriterApplications', () => {
  let component: WriterApplications;
  let fixture: ComponentFixture<WriterApplications>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [WriterApplications]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WriterApplications);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
