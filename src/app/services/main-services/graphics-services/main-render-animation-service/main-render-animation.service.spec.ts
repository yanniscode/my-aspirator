import { TestBed } from '@angular/core/testing';

import { MainRenderAnimationService } from './main-render-animation.service';

describe('MainRenderAnimationService', () => {
  let service: MainRenderAnimationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MainRenderAnimationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
