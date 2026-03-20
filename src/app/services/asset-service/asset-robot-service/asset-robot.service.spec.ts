import { TestBed } from '@angular/core/testing';

import { AssetRobotService } from './asset-robot.service';

describe('AssetRobotService', () => {
  let service: AssetRobotService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AssetRobotService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
