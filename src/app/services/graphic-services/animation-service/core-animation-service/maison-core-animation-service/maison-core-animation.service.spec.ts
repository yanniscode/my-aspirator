import { TestBed } from '@angular/core/testing';

import { MaisonCoreAnimationService } from './maison-core-animation.service';

describe('MaisonCoreAnimationService', () => {
  let service: MaisonCoreAnimationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MaisonCoreAnimationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
