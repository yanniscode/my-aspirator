import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LoggerService {

  public messages: string[] = [];

  public add(message: string) {
    console.log("LoggerService - add()");

    this.messages.push(message);
  }

  public clear() {
    console.log("LoggerService - clear()");

    this.messages = [];
  }
}
