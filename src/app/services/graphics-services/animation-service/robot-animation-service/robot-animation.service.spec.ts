import { TestBed } from '@angular/core/testing';

import { RobotAnimationService } from './robot-animation.service';

describe('RobotAnimationService', () => {
  let service: RobotAnimationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RobotAnimationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
