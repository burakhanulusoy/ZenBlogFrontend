import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WriterApplicationDetail } from './writer-application-detail';

describe('WriterApplicationDetail', () => {
  let component: WriterApplicationDetail;
  let fixture: ComponentFixture<WriterApplicationDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [WriterApplicationDetail]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WriterApplicationDetail);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
