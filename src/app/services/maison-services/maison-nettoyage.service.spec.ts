import { TestBed } from '@angular/core/testing';
import { MaisonNettoyageService } from './maison-nettoyage.service';


describe('MaisonNettoyageService', () => {
  let service: MaisonNettoyageService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MaisonNettoyageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
