import { TestBed } from '@angular/core/testing';

import { RobotAspiromanAnimationService } from './robot-aspiroman-animation.service';

describe('RobotAspiromanAnimationService', () => {
  let service: RobotAspiromanAnimationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RobotAspiromanAnimationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
