import { TestBed } from '@angular/core/testing';

import { RobotAspiromanRenderAnimationService } from './robot-aspiroman-render-animation.service';

describe('RobotAspiromanRenderAnimationService', () => {
  let service: RobotAspiromanRenderAnimationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RobotAspiromanRenderAnimationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
