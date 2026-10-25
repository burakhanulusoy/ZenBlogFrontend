import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SiteCategory } from './site-category';

describe('SiteCategory', () => {
  let component: SiteCategory;
  let fixture: ComponentFixture<SiteCategory>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SiteCategory]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SiteCategory);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
