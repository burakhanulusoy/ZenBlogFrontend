import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SiteAbout } from './site-about';

describe('SiteAbout', () => {
  let component: SiteAbout;
  let fixture: ComponentFixture<SiteAbout>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SiteAbout]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SiteAbout);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
