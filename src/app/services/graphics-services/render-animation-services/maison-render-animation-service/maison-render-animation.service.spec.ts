import { TestBed } from '@angular/core/testing';

import { MaisonRenderAnimationService } from './maison-render-animation.service';

describe('MaisonRenderAnimationService', () => {
  let service: MaisonRenderAnimationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MaisonRenderAnimationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
