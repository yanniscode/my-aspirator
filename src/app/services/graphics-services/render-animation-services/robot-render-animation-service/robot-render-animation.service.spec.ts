import { TestBed } from '@angular/core/testing';

import { RobotRenderAnimationService } from './robot-render-animation.service';

describe('RobotRenderAnimationService', () => {
  let service: RobotRenderAnimationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RobotRenderAnimationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
