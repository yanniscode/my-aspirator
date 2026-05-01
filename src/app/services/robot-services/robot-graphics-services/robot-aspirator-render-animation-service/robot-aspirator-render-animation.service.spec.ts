import { TestBed } from '@angular/core/testing';

import { RobotAspiratorRenderAnimationService } from './robot-aspirator-render-animation.service';

describe('RobotAspiratorRenderAnimationService', () => {
  let service: RobotAspiratorRenderAnimationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RobotAspiratorRenderAnimationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
