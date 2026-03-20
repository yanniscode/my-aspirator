import { TestBed } from '@angular/core/testing';

import { RobotService } from './robot.service';

describe('RobotAspiratorDataService', () => {
  let service: RobotService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RobotService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
