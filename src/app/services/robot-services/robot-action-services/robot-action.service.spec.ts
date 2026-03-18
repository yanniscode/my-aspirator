import { TestBed } from '@angular/core/testing';

import { RobotActionService } from './robot-action.service';

describe('RobotActionService', () => {
  let service: RobotActionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RobotActionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
