import { TestBed } from '@angular/core/testing';
import { AlgoCheminOptimalService } from './algo-chemin-optimal.service';

describe('AlgoCheminOptimalService', () => {
  let service: AlgoCheminOptimalService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AlgoCheminOptimalService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
