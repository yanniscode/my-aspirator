import { TestBed } from '@angular/core/testing';

import { RobotActionAspiromanService } from './robot-action-aspiroman.service';

describe('RobotActionAspiromanService', () => {
  let service: RobotActionAspiromanService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RobotActionAspiromanService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
