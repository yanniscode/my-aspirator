import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, EventEmitter, inject, Input, Output, ViewChild, ViewEncapsulation } from '@angular/core';

import { MessageService } from '../../services/message-service/message.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-robot-aspirator',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './robot-aspirator.component.html',
  styleUrl: './robot-aspirator.component.css',
  changeDetection: ChangeDetectionStrategy.Default,
  encapsulation: ViewEncapsulation.None,
})
export class RobotAspiratorComponent implements AfterViewInit {
  @ViewChild('aspiratorImage', { static: false }) aspiratorImage!: ElementRef<HTMLImageElement>;

  private messageService: MessageService = inject(MessageService);

  // TODO: faire passer datas du parent:
  @Input() aspiroSizeInput: number;
  @Input() aspiroName: string;
  @Input() aspiroXInput: number;
  @Input() aspiroYInput: number;

  @Output() public imageReady = new EventEmitter<HTMLImageElement>();

  constructor() {
    console.log("RobotAspiratorComponent - constructor()");
    this.aspiroSizeInput = 0;
    this.aspiroName = "";
    this.aspiroXInput = -1;
    this.aspiroYInput = -1;
  }

  ngAfterViewInit() {
    console.log("RobotAspiratorComponent - ngAfterViewInit()");

    this.imageReady.emit(this.aspiratorImage.nativeElement);
  }

  // ngOnChanges() {
  //   console.log("RobotAspiratorComponent - ngOnChanges()");

  //   console.log(this.aspiroName);
  //   console.log(this.aspiroSizeInput);
  //   console.log(this.aspiroXInput);
  // }

  private log(message: string) {
    this.messageService.add(`RobotAspiratorComponent: ${message}`);
  }
}
