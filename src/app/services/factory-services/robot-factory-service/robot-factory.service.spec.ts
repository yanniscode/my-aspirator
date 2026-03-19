import { TestBed } from '@angular/core/testing';

import { RobotFactoryService } from './robot-factory.service';

describe('RobotFactoryService', () => {
  let service: RobotFactoryService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RobotFactoryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
