import { TestBed } from '@angular/core/testing';

import { RobotCoreAnimationService } from './robot-core-animation.service';

describe('RobotCoreAnimationService', () => {
  let service: RobotCoreAnimationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RobotCoreAnimationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
