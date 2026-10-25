import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SiteContact } from './site-contact';

describe('SiteContact', () => {
  let component: SiteContact;
  let fixture: ComponentFixture<SiteContact>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SiteContact]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SiteContact);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
