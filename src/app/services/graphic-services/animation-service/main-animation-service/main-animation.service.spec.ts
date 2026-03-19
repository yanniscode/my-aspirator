import { TestBed } from '@angular/core/testing';

import { MainAnimationService } from './main-animation.service';

describe('MainAnimationService', () => {
  let service: MainAnimationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MainAnimationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
