import { Injectable } from '@angular/core';
import { AssetService } from '../../../main-services/graphics-services/asset-service/asset.service';

@Injectable({
  providedIn: 'root',
})
export abstract class AssetRobotService extends AssetService {

  private static ROBOT_IMAGES_PATH = '/assets/megaman';

  constructor() {
    console.log("AssetRobotService - constructor()");
    super();

    this.ASSETS = [
      { name: 'robot-e1', path: AssetRobotService.ROBOT_IMAGES_PATH + '/horizontales/droite/megaman-droite-1.png' },
      { name: 'robot-e2', path: AssetRobotService.ROBOT_IMAGES_PATH + '/horizontales/droite/megaman-droite-2.png' },
      { name: 'robot-e3', path: AssetRobotService.ROBOT_IMAGES_PATH + '/horizontales/droite/megaman-droite-3.png' },
      { name: 'robot-e5', path: AssetRobotService.ROBOT_IMAGES_PATH + '/horizontales/droite/megaman-droite-5.png' },
      { name: 'robot-e4', path: AssetRobotService.ROBOT_IMAGES_PATH + '/horizontales/droite/megaman-droite-4.png' },

      { name: 'robot-w1', path: AssetRobotService.ROBOT_IMAGES_PATH + '/horizontales/gauche/megaman-gauche-1.png' },
      { name: 'robot-w2', path: AssetRobotService.ROBOT_IMAGES_PATH + '/horizontales/gauche/megaman-gauche-2.png' },
      { name: 'robot-w3', path: AssetRobotService.ROBOT_IMAGES_PATH + '/horizontales/gauche/megaman-gauche-3.png' },
      { name: 'robot-w4', path: AssetRobotService.ROBOT_IMAGES_PATH + '/horizontales/gauche/megaman-gauche-4.png' },
      { name: 'robot-w5', path: AssetRobotService.ROBOT_IMAGES_PATH + '/horizontales/gauche/megaman-gauche-5.png' },

      { name: 'robot-n1', path: AssetRobotService.ROBOT_IMAGES_PATH + '/verticales/droite/megaman-verticale-droite-1.png' },
      { name: 'robot-n2', path: AssetRobotService.ROBOT_IMAGES_PATH + '/verticales/droite/megaman-verticale-droite-2.png' },
      { name: 'robot-n3', path: AssetRobotService.ROBOT_IMAGES_PATH + '/verticales/droite/megaman-verticale-droite-3.png' },
      { name: 'robot-n4', path: AssetRobotService.ROBOT_IMAGES_PATH + '/verticales/droite/megaman-verticale-droite-4.png' },
      { name: 'robot-n5', path: AssetRobotService.ROBOT_IMAGES_PATH + '/verticales/droite/megaman-verticale-droite-5.png' },

      { name: 'robot-s1', path: AssetRobotService.ROBOT_IMAGES_PATH + '/verticales/gauche/megaman-verticale-gauche-1.png' },
      { name: 'robot-s2', path: AssetRobotService.ROBOT_IMAGES_PATH + '/verticales/gauche/megaman-verticale-gauche-2.png' },
      { name: 'robot-s3', path: AssetRobotService.ROBOT_IMAGES_PATH + '/verticales/gauche/megaman-verticale-gauche-3.png' },
      { name: 'robot-s4', path: AssetRobotService.ROBOT_IMAGES_PATH + '/verticales/gauche/megaman-verticale-gauche-4.png' },
      { name: 'robot-s5', path: AssetRobotService.ROBOT_IMAGES_PATH + '/verticales/gauche/megaman-verticale-gauche-5.png' },
    ];
  }

  /**
   * On définit une couleur random pour le label du robot
   *
   * @returns
   */
  public getRandomRobotLabelColor(): string {
    console.log("AssetRobotService - getRandomRobotLabelColor()");

    this.labelColor = "#";
    for (var i = 0; i < 6; i++) {
      this.labelColor += this.lettersColor[Math.floor(Math.random() * 16)];
    }
    return this.labelColor;
  }

  // Bonus — couleur batterie selon niveau (vert/orange/rouge)
  /**
   *
   * @param batterie
   * @returns
   */
  public getRobotBatterieColor(batterie: number | undefined): string {
    // console.log("AssetRobotService - getRobotBatterieColor()");

    if (batterie === undefined || batterie < 0) return '#ffffff';
    if (batterie > 20) return '#00ff00';  // vert
    if (batterie > 10) return '#ffa500';  // orange
    return '#ff0000';                      // rouge
  }
}
