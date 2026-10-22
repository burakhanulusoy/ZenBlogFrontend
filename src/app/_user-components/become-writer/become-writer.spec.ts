import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BecomeWriter } from './become-writer';

describe('BecomeWriter', () => {
  let component: BecomeWriter;
  let fixture: ComponentFixture<BecomeWriter>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [BecomeWriter]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BecomeWriter);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
