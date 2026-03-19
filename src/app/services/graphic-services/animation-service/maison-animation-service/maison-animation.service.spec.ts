import { TestBed } from '@angular/core/testing';

import { MaisonAnimationService } from './maison-animation.service';

describe('MaisonAnimationService', () => {
  let service: MaisonAnimationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MaisonAnimationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
