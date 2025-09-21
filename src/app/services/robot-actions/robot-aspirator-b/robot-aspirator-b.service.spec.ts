import { TestBed } from '@angular/core/testing';
import { RobotAspiratorBService } from './robot-aspirator-b.service';

describe('RobotAspiratorService2Service', () => {

  let service: RobotAspiratorBService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RobotAspiratorBService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
