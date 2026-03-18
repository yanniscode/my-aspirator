import { TestBed } from '@angular/core/testing';

import { AssetMaisonService } from './asset-maison.service';

describe('AssetMaisonService', () => {
  let service: AssetMaisonService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AssetMaisonService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
