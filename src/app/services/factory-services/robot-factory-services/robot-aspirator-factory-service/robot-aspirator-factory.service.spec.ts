import { TestBed } from '@angular/core/testing';

import { RobotAspiratorFactoryService } from './robot-aspirator-factory.service';

describe('RobotAspiratorFactoryService', () => {
  let service: RobotAspiratorFactoryService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RobotAspiratorFactoryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
