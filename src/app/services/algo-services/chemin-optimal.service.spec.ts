import { TestBed } from '@angular/core/testing';

import { CheminOptimalService } from './chemin-optimal.service';

describe('CheminOptimalService', () => {
  let service: CheminOptimalService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CheminOptimalService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
