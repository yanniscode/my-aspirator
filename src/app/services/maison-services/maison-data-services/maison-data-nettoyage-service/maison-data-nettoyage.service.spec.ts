import { TestBed } from '@angular/core/testing';
import { MaisonDataNettoyageService } from './maison-data-nettoyage.service';


describe('MaisonDataNettoyageService', () => {
  let service: MaisonDataNettoyageService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MaisonDataNettoyageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
