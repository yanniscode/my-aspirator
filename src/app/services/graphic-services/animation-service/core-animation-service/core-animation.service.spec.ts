import { TestBed } from '@angular/core/testing';

import { CoreAnimationService } from './core-animation.service';

describe('CoreAnimationService', () => {
  let service: CoreAnimationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CoreAnimationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
