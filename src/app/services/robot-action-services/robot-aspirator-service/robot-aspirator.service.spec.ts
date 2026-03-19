import { TestBed } from '@angular/core/testing';

import { RobotAspiratorService } from './robot-aspirator.service';

describe('RobotAspiratorService', () => {
  let service: RobotAspiratorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RobotAspiratorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
