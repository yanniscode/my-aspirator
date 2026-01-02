import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, EventEmitter, inject, Input, OnChanges, Output, ViewChild, ViewEncapsulation } from '@angular/core';

import { MessageService } from '../../services/message-service/message.service';
import { CommonModule } from '@angular/common';
import { RobotAspiratorModel } from '../../classes/models/robot-aspirator-model';

@Component({
  selector: 'app-robot-aspirator',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './robot-aspirator.component.html',
  styleUrl: './robot-aspirator.component.css',
  changeDetection: ChangeDetectionStrategy.Default,
  encapsulation: ViewEncapsulation.None,
})
export class RobotAspiratorComponent implements AfterViewInit, OnChanges {
  @ViewChild('aspiratorImage', { static: false }) aspiratorImage!: ElementRef<HTMLImageElement>;

  private messageService: MessageService = inject(MessageService);

  // TODO: faire passer datas du parent:
  // @Input() robotInput!: RobotAspiratorModel;
  @Input() aspiroSizeInput!: number;
  @Input() aspiroXInput!: number;
  @Input() aspiroYInput!: number;

  @Output() public imageReady = new EventEmitter<HTMLImageElement>();

  constructor() {
    console.log("RobotAspiratorComponent - constructor()");
  }

  ngAfterViewInit() {
    console.log("RobotAspiratorComponent - ngAfterViewInit()");

    this.imageReady.emit(this.aspiratorImage.nativeElement);
  }

  ngOnChanges() {
    // console.log("RobotAspiratorComponent - ngOnChanges()");

    // console.log(this.robotInput);
    // console.log(this.robotInput.lastPosition.x);
    // console.log(this.robotInput.lastPosition.y);
    // console.log(this.robotInput.position.x);
    // console.log(this.robotInput.position.y);

    // console.log(this.aspiroXInput);
    // console.log(this.aspiroYInput);

    // console.log(this.aspiroSizeInput);
  }

  private log(message: string) {
    this.messageService.add(`RobotAspiratorComponent: ${message}`);
  }
}
