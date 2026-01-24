import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, EventEmitter, inject, Input, OnChanges, Output, ViewChild, ViewEncapsulation } from '@angular/core';

import { MessageService } from '../../services/message-service/message.service';
import { CommonModule } from '@angular/common';
import { Position } from '../../classes/models/position';

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
  @Input() robotAspiroSizeInput: number;
  @Input() robotAspiroName: string;
  @Input() aspiroCoordinateInput: Position;

  @Output() public imageReady = new EventEmitter<HTMLImageElement>();

  constructor() {
    console.log("RobotAspiratorComponent - constructor()");
    this.robotAspiroSizeInput = 0;
    this.robotAspiroName = "";
    this.aspiroCoordinateInput = new Position();
  }

  ngAfterViewInit(): void {
    console.log("RobotAspiratorComponent - ngAfterViewInit()");

    this.imageReady.emit(this.aspiratorImage.nativeElement);
  }

  ngOnChanges(): void {
    console.log("RobotAspiratorComponent - ngOnChanges()");

    console.log(this.robotAspiroName);
    console.log(this.robotAspiroSizeInput);
    console.log(this.aspiroCoordinateInput.x);
    console.log(this.aspiroCoordinateInput.y);
  }

  private log(message: string) {
    this.messageService.add(`RobotAspiratorComponent: ${message}`);
  }
}
