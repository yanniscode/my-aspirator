import { TestBed } from '@angular/core/testing';

import { MaisonDataFactoryService } from './maison-data-factory.service';

describe('MaisonDataFactoryService', () => {
  let service: MaisonDataFactoryService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MaisonDataFactoryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
