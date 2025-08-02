import { Component, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { MessageService } from '../../services/message.service';

@Component({
  selector: 'app-robot-aspirator',
  standalone: true, // Composant autonome
  templateUrl: './robot-aspirator.component.html',
  styleUrl: './robot-aspirator.component.css'
})
export class RobotAspiratorComponent implements OnDestroy {

  // nécessaire pour l'animation (écoute d'observable avec rxjs)
  private subscription?: Subscription;

  private log(message: string) {
    this.messageService.add(`RobotAspiratorComponent: ${message}`);
  }

  constructor(private messageService: MessageService) {
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.log("RobotAspiratorComponent - ngOnDestroy unsubscribe !");
      this.subscription.unsubscribe();
    }
  }
}
