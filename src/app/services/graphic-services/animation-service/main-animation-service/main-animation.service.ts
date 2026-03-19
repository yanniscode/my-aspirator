import { Injectable, inject } from "@angular/core";
import { LoggerService } from "../../../data-services/logger-service/logger.service";
import { AnimationService } from "../animation.service";

@Injectable({
  providedIn: 'root',
})
export abstract class MainAnimationService extends AnimationService {

  // private loggerService = inject(LoggerService);

  // protected ctx!: CanvasRenderingContext2D;

  // constructor() {
  //   super();
  //   console.log("MainAnimationService - constructor()");
  // }

  // private log(message: string): void {
  //   this.loggerService.add(`RobotAnimationService: ${message}`);
  // }
}
