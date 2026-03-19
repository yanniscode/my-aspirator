import { TestBed } from '@angular/core/testing';

import { RobotDataService } from './robot-data.service';

describe('RobotDataService', () => {
  let service: RobotDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RobotDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
