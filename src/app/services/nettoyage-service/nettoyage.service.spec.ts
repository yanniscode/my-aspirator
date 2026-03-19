import { TestBed } from '@angular/core/testing';

import { NettoyageService } from './nettoyage.service';

describe('NettoyageService', () => {
  let service: NettoyageService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NettoyageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
