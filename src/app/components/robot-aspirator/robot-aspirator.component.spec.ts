import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RobotAspiratorComponent } from './robot-aspirator.component';

describe('RobotAspiratorComponent', () => {
  let component: RobotAspiratorComponent;
  let fixture: ComponentFixture<RobotAspiratorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RobotAspiratorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RobotAspiratorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
