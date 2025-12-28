import { ChangeDetectionStrategy, Component, inject, ViewEncapsulation } from '@angular/core';

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
export class RobotAspiratorComponent {

  private messageService: MessageService = inject(MessageService);

  constructor() {
    console.log("RobotAspiratorComponent - constructor()");
  }

  private log(message: string) {
    this.messageService.add(`RobotAspiratorComponent: ${message}`);
  }
}
