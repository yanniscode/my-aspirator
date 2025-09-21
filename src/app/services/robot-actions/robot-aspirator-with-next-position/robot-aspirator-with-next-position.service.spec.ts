import { TestBed } from '@angular/core/testing';
import { RobotAspiratorWithNextPositionService } from './robot-aspirator-with-next-position.service';

describe('RobotAspiratorWithNextPositionService', () => {

  let robotAspiratorWithNextPositionService: RobotAspiratorWithNextPositionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    robotAspiratorWithNextPositionService = TestBed.inject(RobotAspiratorWithNextPositionService);
  });

  it('should be created', () => {
    expect(robotAspiratorWithNextPositionService).toBeTruthy();
  });
});
