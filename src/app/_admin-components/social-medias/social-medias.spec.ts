import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SocialMedias } from './social-medias';

describe('SocialMedias', () => {
  let component: SocialMedias;
  let fixture: ComponentFixture<SocialMedias>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SocialMedias]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SocialMedias);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
