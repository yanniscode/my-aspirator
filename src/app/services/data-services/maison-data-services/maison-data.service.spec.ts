import { TestBed } from '@angular/core/testing';
import { MaisonDataService } from './maison-data.service';

describe('MaisonDataService', () => {
  let service: MaisonDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MaisonDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
