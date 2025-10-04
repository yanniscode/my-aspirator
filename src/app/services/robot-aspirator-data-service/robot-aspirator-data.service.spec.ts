import { TestBed } from '@angular/core/testing';

import { RobotAspiratorDataService } from './robot-aspirator-data.service';

describe('RobotAspiratorDataService', () => {
  let service: RobotAspiratorDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RobotAspiratorDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
