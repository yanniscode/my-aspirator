import { TestBed } from '@angular/core/testing';

import { RenderFactoryService } from './render-factory.service';

describe('RenderFactoryService', () => {
  let service: RenderFactoryService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RenderFactoryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
