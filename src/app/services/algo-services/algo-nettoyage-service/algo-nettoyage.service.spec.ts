import { TestBed } from '@angular/core/testing';
import { AlgoNettoyageService } from './algo-nettoyage.service';

describe('NettoyageService', () => {
  let service: AlgoNettoyageService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AlgoNettoyageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
