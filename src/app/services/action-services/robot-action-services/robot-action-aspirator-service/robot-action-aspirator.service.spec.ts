import { TestBed } from '@angular/core/testing';

import { RobotActionAspiratorService } from './robot-action-aspirator.service';

describe('RobotActionAspiratorService', () => {
  let service: RobotActionAspiratorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RobotActionAspiratorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
