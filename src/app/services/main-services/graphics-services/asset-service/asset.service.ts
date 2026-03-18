import { Injectable, Signal, signal, WritableSignal } from '@angular/core';
import { AssetConfig } from '../../../../classes/config/asset-config';
import { Direction } from '../../../../classes/utils/direction';

@Injectable({
  providedIn: 'root',
})
export abstract class AssetService {

  private images: Map<string, HTMLImageElement> = new Map();

  protected ASSETS: AssetConfig[] = [{ name: '', path: '' }];

  private _assetsLoaded: WritableSignal<boolean> = signal(false);
  public assetsLoaded: Signal<boolean> = this._assetsLoaded.asReadonly();

  private _loadingError: WritableSignal<string | null> = signal(null);
  public loadingError: Signal<string | null> = this._loadingError.asReadonly();

  // Variables pour les couleurs du personnage (ex: label du nom d'un robot)
  protected lettersColor = '0123456789ABCDEF';
  public labelColor = '#';

  constructor() {
    this.images = new Map<string, HTMLImageElement>();
  }

  /**
   * Récupère une image chargée par son nom.
   * Retourne undefined si l'image n'existe pas ou n'est pas encore chargée.
   *
   * @param name
   * @returns
   */
  public getImage(name: string): HTMLImageElement {
    const img = this.images.get(name);
    if (!img) {
      throw new Error(`Asset "${name}" non trouvé. loadAssets() a-t-il été appelé ?`);
    }
    return img; // TypeScript sait que c'est HTMLImageElement, plus de undefined
  }

  /**
   * Récupère la trame d'animation du robot selon sa direction et son index (animationProgress)
   * @param direction
   * @param indexImage
   * @returns
   */
  public getRobotImageByHisFrameAndDirection(direction: Direction, animationProgress: number): HTMLImageElement {

    let dir = "e";

    if (direction === Direction.NORTH) {
      dir = "n";
    }
    else if (direction === Direction.EAST) {
      dir = "e";
    }
    else if (direction === Direction.SOUTH) {
      dir = "s";
    }
    else if (direction === Direction.WEST) {
      dir = "w";
    }
    return this.getImage('robot-' + dir + animationProgress);
  }

  /**
   *
   * @param type
   */
  public abstract getImageForCell(type: string): HTMLImageElement | undefined;

  // /**
  //  *
  //  * @returns
  //  */
  // public isLoaded(): boolean {
  //   return this.images.size === this.ASSETS.length;
  // }

  /**
   * Promise = adaptée au chargement d'assets. Le chargement d'images est un événement "one-shot"
   *
   * @param asset
   * @returns
   */
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
