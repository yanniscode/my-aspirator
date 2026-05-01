import { TestBed } from '@angular/core/testing';
import { RobotAspiromanDataService } from './robot-aspiroman-data.service';

describe('RobotAspiromanDataService', () => {
  let service: RobotAspiromanDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RobotAspiromanDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
