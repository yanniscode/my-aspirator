import { TestBed } from '@angular/core/testing';

import { RobotAspiratorWithNextPositionsTabService } from './robot-aspirator-with-next-positions-tab.service';

describe('RobotAspiratorService', () => {
  let service: RobotAspiratorWithNextPositionsTabService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RobotAspiratorWithNextPositionsTabService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
