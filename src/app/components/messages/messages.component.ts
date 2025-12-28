import { Component, inject } from '@angular/core';

import { MessageService } from '../../services/message-service/message.service';

@Component({
  selector: 'app-messages',
  imports: [],
  templateUrl: './messages.component.html',
  styleUrls: ['./messages.component.css']
})
export class MessagesComponent {

  // public car accédé depuis le template
  public messageService = inject(MessageService);

  constructor() {
    console.log("MessagesComponent - constructor()");
  }
}
