import { Component } from '@angular/core';
import { MessageService } from '../services/message.service';
import { NgIf, NgFor } from '@angular/common';

@Component({
  selector: 'app-messages',
  imports: [NgIf, NgFor],
  templateUrl: './messages.component.html',
  styleUrls: ['./messages.component.css']
})
export class MessagesComponent {

  constructor(public messageService: MessageService) {}

}
