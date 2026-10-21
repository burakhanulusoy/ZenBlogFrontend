import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WriterLayout } from './writer-layout';

describe('WriterLayout', () => {
  let component: WriterLayout;
  let fixture: ComponentFixture<WriterLayout>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [WriterLayout]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WriterLayout);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
