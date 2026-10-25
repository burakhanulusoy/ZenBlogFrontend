import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SiteBlogDetail } from './site-blog-detail';

describe('SiteBlogDetail', () => {
  let component: SiteBlogDetail;
  let fixture: ComponentFixture<SiteBlogDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SiteBlogDetail]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SiteBlogDetail);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
