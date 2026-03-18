import { Injectable, Signal, signal, WritableSignal } from '@angular/core';
import { AssetConfig } from './asset-config';

@Injectable({
  providedIn: 'root',
})
export class AssetService {

  private images: Map<string, HTMLImageElement> = new Map();

  private readonly ASSETS: AssetConfig[] = [
    { name: 'robot', path: '/assets/megaman.png' },
    { name: 'mur', path: '/assets/texture-mur.png' },
    { name: 'base', path: '/assets/texture-base.png' },
    { name: 'visitee', path: '/assets/texture-visitee.png' },
    { name: 'nonVisitee', path: '/assets/texture-non-visitee.png' },
  ];

  private _assetsLoaded: WritableSignal<boolean> = signal(false);
  public assetsLoaded: Signal<boolean> = this._assetsLoaded.asReadonly();

  private _loadingError: WritableSignal<string | null> = signal(null);
  public loadingError: Signal<string | null> = this._loadingError.asReadonly();

  // Variables pour les couleurs du robot (actuellement: pour le nom)
  private colorLetters = '0123456789ABCDEF';
  public robotColor = '#';

  constructor() {
    this.images = new Map<string, HTMLImageElement>();
  }

  // On définit une couleur random pour le label du robot
  public getRandomRobotLabelColor(): string {
    this.robotColor = "#";
    for (var i = 0; i < 6; i++) {
      this.robotColor += this.colorLetters[Math.floor(Math.random() * 16)];
    }
    return this.robotColor;
  }

  // Bonus — couleur batterie selon niveau (vert/orange/rouge)
  public getBatterieColor(batterie: number | undefined): string {
    if (batterie === undefined || batterie < 0) return '#ffffff';
    if (batterie > 20) return '#00ff00';  // vert
    if (batterie > 10) return '#ffa500';  // orange
    return '#ff0000';                      // rouge
  }

  /**
* Récupère une image chargée par son nom.
* Retourne undefined si l'image n'existe pas ou n'est pas encore chargée.
*/
  public getImage(name: string): HTMLImageElement {
    const img = this.images.get(name);
    if (!img) {
      throw new Error(`Asset "${name}" non trouvé. loadAssets() a-t-il été appelé ?`);
    }
    return img; // TypeScript sait que c'est HTMLImageElement, plus de undefined
  }

  public getImageForCell(type: string): HTMLImageElement | undefined {
    switch (type) {
      case 'O': return this.getImage('nonVisitee');
      case 'X': return this.getImage('mur');
      case 'B': return this.getImage('base');
      case '_': return this.getImage('visitee');
      default: return undefined;
    }
  }

  public isLoaded(): boolean {
    return this.images.size === this.ASSETS.length;
  }

  // Promise = adaptée au chargement d'assets. Le chargement d'images est un événement "one-shot"
  private loadImage(asset: AssetConfig): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = () => {
        this.images.set(asset.name, img);
        resolve();
      };

      img.onerror = () => {
        console.error(`Erreur chargement asset : ${asset.path}`);
        reject(new Error(`Impossible de charger : ${asset.path}`));
      };

      img.src = asset.path;
    });
  }

  /**
 * Charge toutes les images de manière asynchrone.
 * Utilisation d'une Promise pour attendre le chargement → utile pour la game loop
 */
  public loadAssets(): Promise<void> {
    const promises = this.ASSETS.map(asset => this.loadImage(asset));

    return Promise.all(promises)
      .then(() => {
        this._assetsLoaded.set(true);  // ← réactif pour l'UI
      })
      .catch((err) => {
        this._loadingError.set(err.message);  // ← réactif pour afficher l'erreur
      });
  }
}
