import { TestBed } from '@angular/core/testing';

import { RobotAspiratorDataFactoryService } from './robot-aspirator-data-factory.service';

describe('RobotAspiratorDataFactoryService', () => {
  let service: RobotAspiratorDataFactoryService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RobotAspiratorDataFactoryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
