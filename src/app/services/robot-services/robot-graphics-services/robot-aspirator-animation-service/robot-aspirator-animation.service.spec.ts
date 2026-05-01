import { TestBed } from '@angular/core/testing';

import { RobotAspiratorAnimationService } from './robot-aspirator-animation.service';

describe('RobotAspiratorAnimationService', () => {
  let service: RobotAspiratorAnimationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RobotAspiratorAnimationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
