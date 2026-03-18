import { TestBed } from '@angular/core/testing';
import { RobotDataFactoryService } from './robot-data-factory.service';


describe('DataFactoryService', () => {
  let service: RobotDataFactoryService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RobotDataFactoryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
