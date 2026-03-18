import { Component, inject } from '@angular/core';

import { LoggerService } from '../../services/main-services/logger-service/logger.service';

@Component({
  selector: 'app-messages',
  imports: [],
  templateUrl: './messages.component.html',
  styleUrls: ['./messages.component.css']
})
export class MessagesComponent {

  // public car accédé depuis le template
  public loggerService = inject(LoggerService);

  constructor() {
    console.log("MessagesComponent - constructor()");
  }
}
