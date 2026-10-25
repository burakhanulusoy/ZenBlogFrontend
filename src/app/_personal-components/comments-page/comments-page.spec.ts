import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommentsPage } from './comments-page';

describe('CommentsPage', () => {
  let component: CommentsPage;
  let fixture: ComponentFixture<CommentsPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CommentsPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CommentsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
