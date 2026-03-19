import { TestBed } from '@angular/core/testing';

import { AnimationFactoryService } from './animation-factory.service';

describe('AnimationFactoryService', () => {
  let service: AnimationFactoryService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AnimationFactoryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
