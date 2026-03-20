import { computed, inject, Injectable, OnDestroy, Signal, WritableSignal } from '@angular/core';
import { RobotAspiratorModel } from '../../classes/models/robot-aspirator-model';
import { MaisonModel } from '../../classes/models/maison-model';
import { GridPosition } from '../../classes/models/grid-position';
import { PixelPosition } from '../../classes/models/pixel-position';
import { CellElement } from '../../classes/models/cellElement';
import { RobotService } from '../robot-service/robot.service';
import { MaisonNettoyageService } from '../maison-services/maison-nettoyage.service';

@Injectable({
  providedIn: 'root'
})
export class RobotAspiratorService extends RobotService implements OnDestroy {

  private maisonNettoyageService = inject(MaisonNettoyageService);

  public readonly maisonSignal: Signal<MaisonModel> = computed(() =>
    this.maisonNettoyageService.maisonSignal()
  );

  constructor() {
    console.log("RobotAspiratorService - constructor()");
    super();
    this.PIXELS_PER_STEP = 50;
  }

  // TODO : abstract dans classe parente
  /**
 * Calcule de nouvelles directions selon le temps donné
 */
  public calculateNewDirectionsForAllRobots(): void {
    console.log("RobotAspiratorService - calculateNewDirectionsForAllRobots()");

    if (this._robotSignals.size <= 0) return;

    // Parcourt tous les robots
    this._robotSignals.forEach((robotSignal: WritableSignal<RobotAspiratorModel>, robotName) => {

      const robot = robotSignal();
      if (!robot) return;
      console.log(robot);

      let nextPosition: GridPosition = robot.position;
      if (!nextPosition) return;

      if (robot.batterie <= 0) {
        if (robot!.position.col === robot!.basePosition.col && robot!.position.row === robot!.basePosition.row
        ) {
          console.log(`### Le robot est à sa base et ne peut démarrer - Batterie: ${robot.batterie}%`);
        }
        else {
          console.log(`### Le robot est à l'arrêt en cours de parcours et ne peut redémarrer - Batterie: ${robot.batterie}%`);
        }

        this.stopRobot(robotName, robot.position, nextPosition);
        return;
      }
      else if (robot.batterie > 0) {

        if (robot.isRobotReturningToBase) {

          if (robot.position.col === robot.basePosition.col && robot.position.row === robot.basePosition.row) {
            this.stopRobot(robotName, robot.position, nextPosition);
            console.log("Arrêt effectué - retour à la base accomplit !");
            return;
          }

          this.activateReturnToBase(robot);
          return;
        }
        else if (this.maisonNettoyageService.toutEstVisite()) {

          console.log(`### updateAllRobots() - Maison entièrement nettoyée ou bien: limite de batterie atteinte : le robot doit rentrer à la base - Batterie: ${robot.batterie}%`);

          this.activateReturnToBase(robot);
          return;

        } else { // si la maison n'est pas totalement nettoyée

          // Dans cette version de l'algo de nettoyage: on prend la première position du chemin à chaque tour de boucle
          // (permet de vérifier le chemin à chaque pas, si plusieurs robots sont présents)
          nextPosition = this.nettoyer(robot);

          const batteryLimitExceeded: boolean = this.robotDoitRentrerALaBase(
            robot.batterie,
            nextPosition,
            robot.basePosition,
            robot.consommationParMouvement
          );
          if (batteryLimitExceeded) {
            console.log("batteryLimitExceeded !");
            console.log(`### Limite de batterie dépassée pour le Robot ${robot.robotName} : row = ${robot.position.row}, col = ${robot.position.col} - Batterie: ${robot.batterie}%`);
            this.activateReturnToBase(robot);
            return;
          }

          console.log(`### Nouvelle position de nettoyage trouvée pour le Robot ${robot.robotName} : row = ${nextPosition.row}, col = ${nextPosition.col} - Batterie: ${robot.batterie}%`);
          // MAJ du robot: déplacement normal
          this.moveRobot(robotName, robot.position, nextPosition);
        }
      }
    });
  }

  protected activateReturnToBase(robot: RobotAspiratorModel): void {
    console.log("RobotAspiratorService - activateReturnToBase()");

    const nextPosition = this.retournerALaBase(robot);
    if (!nextPosition) {
      this.stopRobot(robot.robotName, robot.position, nextPosition);
      return;
    }

    // MAJ du robot: retour à la base
    this.setRobotIsReturningToBase(robot.robotName, robot.position, nextPosition);

    console.log(`### Nouvelle position de retour à la base trouvée pour le Robot ${robot.robotName} : row = ${nextPosition.col}, col = ${nextPosition.row} - Batterie: ${robot.batterie}%`);
  }

  protected setRobotIsReturningToBase(robotName: string, position: GridPosition, nextPosition: GridPosition): void {
    console.log("RobotAspiratorService - setRobotIsReturningToBase()");

    const robotSignal: WritableSignal<RobotAspiratorModel> | undefined = this._robotSignals.get(robotName);
    if (!robotSignal) return;

    const robot = robotSignal();

    const newStartCoordinate: PixelPosition = this.calculatePixelCoordinates(position);
    const newTargetCoordinate: PixelPosition = this.calculatePixelCoordinates(nextPosition);

    if (newStartCoordinate.x !== newTargetCoordinate.x || newStartCoordinate.y !== newTargetCoordinate.y) {
      robotSignal.update(robot => ({
        ...robot,
        isRobotStarted: true,
        isRobotReturningToBase: true,
        lastPosition: { ...robot.position }, // la précédente position est modifiée avec l'actuelle
        position: { ...nextPosition },        // la nouvelle position prend sa valeur suivante
        startCoordinate: { ...newStartCoordinate }, // la précédente coordonnée est modifiée avec l'actuelle
        targetCoordinate: { ...newTargetCoordinate }, // la nouvelle coordonnée prend sa valeur suivante
        batterie: robot.batterie - robot.consommationParMouvement
      }));
      console.log(`### ${robotName}: tableau [${nextPosition.col},${nextPosition.row}] → pixels (${newTargetCoordinate.x}, ${newTargetCoordinate.y}) - batterie (${robot.batterie})`);
    } else {
      this.stopRobot(robotName, robot.position, nextPosition);
    }
  }

  /**
  * Déplace manuellement un robot à une position pour le nettoyage
  */
  protected moveRobot(robotName: string, position: GridPosition, nextPosition: GridPosition): void {
    console.log("RobotAspiratorService - moveRobot()");

    const robotSignal: WritableSignal<RobotAspiratorModel> | undefined = this._robotSignals.get(robotName);
    if (!robotSignal) return;

    const robot = robotSignal();
    if (!robot) return;

    const newStartCoordinate: PixelPosition = this.calculatePixelCoordinates(position);
    const newTargetCoordinate: PixelPosition = this.calculatePixelCoordinates(nextPosition);

    if (newStartCoordinate.x !== newTargetCoordinate.x || newStartCoordinate.y !== newTargetCoordinate.y) {

      robotSignal.update(robot => ({
        ...robot,
        isRobotStarted: true,
        isRobotReturningToBase: false,  // le robot ne rentre pas à la base
        lastPosition: { ...robot.position }, // la précédente position est modifiée avec l'actuelle
        position: { ...nextPosition },        // la nouvelle position prend sa valeur suivante
        startCoordinate: { ...newStartCoordinate }, // la précédente coordonnée est modifiée avec l'actuelle
        targetCoordinate: { ...newTargetCoordinate }, // la nouvelle coordonnée prend sa valeur suivante
        batterie: robot.batterie - robot.consommationParMouvement
      }));
    }
    console.log(`### ${robotName}: tableau [${nextPosition.col},${nextPosition.row}] → pixels (${newTargetCoordinate.x}, ${newTargetCoordinate.y}) - batterie (${robot.batterie})`);
  }

  /**
   * Arrêt d'un robot à une position
   *
   * @param robotName
   * @param position
   * @param nextPosition
   * @returns
   */
  protected stopRobot(robotName: string, position: GridPosition, nextPosition: GridPosition): void {
    console.log("RobotAspiratorService - stopRobot()");

    const robotSignal: WritableSignal<RobotAspiratorModel> | undefined = this._robotSignals.get(robotName);
    if (!robotSignal) return;

    const newStartCoordinate: PixelPosition = this.calculatePixelCoordinates(position);
    const newTargetCoordinate: PixelPosition = this.calculatePixelCoordinates(nextPosition);

    robotSignal.update(robot => ({
      ...robot,
      isRobotStarted: false,
      lastPosition: { ...robot.position }, // la précédente position est modifiée avec l'actuelle
      position: { ...nextPosition },        // la nouvelle position prend sa valeur suivante
      startCoordinate: { ...newStartCoordinate }, // la précédente coordonnée est modifiée avec l'actuelle
      targetCoordinate: { ...newTargetCoordinate }, // la nouvelle coordonnée prend sa valeur suivante
    }));
  }

  /** Méthodes propres au robot Aspirateur: */

  // Fonction principale pour nettoyer la maison
  private nettoyer(robotModelInput: RobotAspiratorModel): GridPosition {
    console.log("RobotAspiratorService - nettoyer()");

    const maisonModel: MaisonModel = this.maisonSignal();
    if (!maisonModel) return new GridPosition();

    // Dé-réserver la position actuelle:
    this.maisonNettoyageService.updateReservedCell(robotModelInput.position, false);

    // Chercher la prochaine case non visitée
    let prochaineCaseNonVisitee: CellElement | null = this.nettoyageService.trouverProchaineDestination(maisonModel.maison, robotModelInput.position);
    console.log(prochaineCaseNonVisitee);

    if (!prochaineCaseNonVisitee) {
      console.log("La maison est entièrement nettoyée !");

      let positionRetourALaBase: GridPosition = this.retournerALaBase(robotModelInput);
      console.log("positionRetourALaBase :" + positionRetourALaBase);

      if (!positionRetourALaBase) {
        console.log("Impossible de trouver un chemin vers la destination");
        return robotModelInput.position;
      }

      return positionRetourALaBase;
    } else if (!prochaineCaseNonVisitee.reserved) {
      // Réserver la position non-visitée la plus proche, si elle est accessible
      this.maisonNettoyageService.updateReservedCell(prochaineCaseNonVisitee.position, true);
    }

    // Utiliser un algorithme de recherche de chemin optimal pour rechercher le pas suivant du robot
    let nextPositionNettoyage: GridPosition = this.nettoyageService.trouverPositionSuivante(
      maisonModel.maison, robotModelInput.position, prochaineCaseNonVisitee.position
    );

    console.log("nextPositionNettoyage :" + nextPositionNettoyage);
    if (!nextPositionNettoyage) {
      console.log("Impossible de trouver un chemin vers la destination");
      return robotModelInput.position;
    }

    return nextPositionNettoyage;
  }

  // Retourner à la base de charge
  protected retournerALaBase(robotModelInput: RobotAspiratorModel): GridPosition {
    console.log("RobotAspiratorService - retournerALaBase()");
    console.log("Retour à la base de charge");

    const maisonModel: MaisonModel = this.maisonSignal();
    if (!maisonModel) return new GridPosition();

    // Trouver le chemin vers la base
    const positionRetourALaBase: GridPosition = this.nettoyageService.trouverPositionSuivante(maisonModel.maison, robotModelInput.position, robotModelInput.basePosition);
    console.log("nextPosition :" + positionRetourALaBase);

    if (!positionRetourALaBase) {
      console.log("Impossible de trouver un chemin vers la base de charge!");
      return robotModelInput.position;
    }

    return positionRetourALaBase;
  }

  protected robotDoitRentrerALaBase(batterie: number, position: GridPosition, basePosition: GridPosition, consommationParMouvement: number): boolean {
    console.log("RobotAspiratorService - robotDoitRentrerALaBase()");

    return (position && batterie <= this.energieNecessairePourRetour(position, basePosition, consommationParMouvement)) ?
      true : false;
  }

  // Estimer l'énergie nécessaire au robot pour retourner à la base
  protected energieNecessairePourRetour(position: GridPosition, basePosition: GridPosition, consommationParMouvement: number): number {
    console.log("RobotAspiratorService - energieNecessairePourRetour()");

    const maisonModel: MaisonModel = this.maisonSignal();
    if (!maisonModel) return -1;

    // Estimer la distance jusqu'à la base (la distance de Manhattan ne suffit pas car elle ne tient pas compte des obstacles)
    const distance = this.nettoyageService.distanceDeLaBase(maisonModel.maison, position, basePosition);
    console.log("distance minimale de la base = " + distance);

    // Ajouter une marge de sécurité si on veut:
    return (distance * consommationParMouvement) * 1;
  }

  // MAJ des position visitée de la maison:
  public updateRobotsVisitedCells(): void {
    console.log("RobotAspiratorService - updateRobotsVisitedCells()");

    this._robotSignals.forEach((robotSignal) => {
      const robot: RobotAspiratorModel = robotSignal();
      this.maisonNettoyageService.updateVisitedCell(robot.lastPosition, true);
    });
  }

  // TODO: revoir CSS de la maison si on affiche ces logs dans l'ihm
  private log(message: string) {
    this.loggerService.add(`RobotAspiratorService: ${message}`);
  }
}
