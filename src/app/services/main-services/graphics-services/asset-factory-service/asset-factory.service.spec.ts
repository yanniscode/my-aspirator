import { TestBed } from '@angular/core/testing';

import { AssetFactoryService } from './asset-factory.service';

describe('AssetFactoryService', () => {
  let service: AssetFactoryService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AssetFactoryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
