import { Injectable } from '@angular/core';
import { AssetService } from '../asset.service';

@Injectable({
  providedIn: 'root',
})
export class AssetRobotService extends AssetService {

  constructor() {
    console.log("AssetRobotService - constructor()");
    super();

    this.ASSETS = [
      { name: 'robot', path: '/assets/megaman.png' },
      { name: 'mur', path: '/assets/texture-mur.png' },
      { name: 'base', path: '/assets/texture-base.png' },
      { name: 'visitee', path: '/assets/texture-visitee.png' },
      { name: 'nonVisitee', path: '/assets/texture-non-visitee.png' },
    ];
  }

  /**
   * On définit une couleur random pour le label du robot
   *
   * @returns
   */
  public getRandomRobotLabelColor(): string {
    console.log("AssetRobotService - getRandomRobotLabelColor()");

    this.robotColor = "#";
    for (var i = 0; i < 6; i++) {
      this.robotColor += this.colorLetters[Math.floor(Math.random() * 16)];
    }
    return this.robotColor;
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

  /**
   *
   * @param type
   * @returns
   */
  public getImageForCell(type: string): HTMLImageElement | undefined {
    // console.log("AssetRobotService - getImageForCell()");

    switch (type) {
      case 'O': return this.getImage('nonVisitee');
      case 'X': return this.getImage('mur');
      case 'B': return this.getImage('base');
      case '_': return this.getImage('visitee');
      default: return undefined;
    }
  }
}
