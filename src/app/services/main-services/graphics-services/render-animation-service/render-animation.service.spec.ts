import { TestBed } from '@angular/core/testing';

import { RenderAnimationService } from './render-animation.service';

describe('RenderAnimationService', () => {
  let service: RenderAnimationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RenderAnimationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
