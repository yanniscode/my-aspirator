import { Component } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { MessageService } from '../../services/message-service/message.service';

@Component({
  selector: 'app-messages',
  imports: [NgIf, NgFor],
  templateUrl: './messages.component.html',
  styleUrls: ['./messages.component.css']
})
export class MessagesComponent {

  constructor(public messageService: MessageService) {}

}
