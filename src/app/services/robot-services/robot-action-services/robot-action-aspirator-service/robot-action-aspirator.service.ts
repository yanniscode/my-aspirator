import { inject, Injectable, Signal } from '@angular/core';
import { GridPosition } from '../../../../classes/models/grid-position';
import { PixelPosition } from '../../../../classes/models/pixel-position';
import { RobotActionService } from '../robot-action.service';
import { AlgoNettoyageService } from '../../robot-algos-deplacement-services/algo-nettoyage-service/algo-nettoyage.service';
import { MaisonDataNettoyageService } from '../../../maison-services/maison-data-services/maison-data-nettoyage-service/maison-data-nettoyage.service';
import { RobotAspiratorDataService } from '../../robot-data-services/robot-aspirator-data-service/robot-aspirator-data.service';
import { CellStore } from '../../../../maison.signal-store';
import { CellElement } from '../../../../data-access/maison-data-access/maison.model';
import { RobotAspirator } from '../../../../data-access/robot-data-access/robot.model';

@Injectable({
  providedIn: 'root'
})
export class RobotActionAspiratorService extends RobotActionService<RobotAspirator> {

  private algoNettoyageService = inject(AlgoNettoyageService);
  private robotAspiratorDataService = inject(RobotAspiratorDataService);
  private maisonDataNettoyageService = inject(MaisonDataNettoyageService);

  private cellStore = inject(CellStore);

  // Map en lecture seule pour stocker les signaux computed de chaque robot à afficher
  private readonly robotAspiratorSignals: Map<string, Signal<RobotAspirator>>
    = this.robotAspiratorDataService.robotSignals;

  // Configuration de l'animation
  private PIXELS_PER_STEP: number = 0; // Pixels à parcourir dans un intervale donné

  constructor() {
    console.log("RobotActionAspiratorService - constructor()");
    super();
    this.serviceName = "RobotActionAspiratorService";
    this.PIXELS_PER_STEP = 50;
  }

  /**
   * Calcule de nouvelles directions selon le temps donné et activation des actions spécifiques au robot aspirateur (retour à la base si le niveau de batterie est dépassé)
   */
  public override calculateNewDirectionsForAllRobots(): void {
    console.log("RobotActionAspiratorService - calculateNewDirectionsForAllRobots()");

    if (this.robotAspiratorSignals.size <= 0) return;

    // Parcourt tous les robots
    this.robotAspiratorSignals.forEach((robotSignal: Signal<RobotAspirator>, robotName) => {

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

        this.robotAspiratorDataService.stopRobot(robotName);
        return;
      }
      else if (robot.batterie > 0) {

        if (robot.isRobotReturningToBase) {

          if (robot.position.col === robot.basePosition.col && robot.position.row === robot.basePosition.row) {
            this.robotAspiratorDataService.stopRobot(robotName);
            console.log("Arrêt effectué - retour à la base accomplit !");
            return;
          }

          this.activateReturnToBase(robot);
          return;
        }
        else if (this.cellStore.unVisitedCellsCount() === 0) {

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

          // Réservation de la position suivante trouvée (pour éviter la concurrence d'autres bots)
          this.maisonDataNettoyageService.updateReservedCell(nextPosition, true);

          // MAJ du robot: déplacement normal
          this.robotAspiratorDataService.moveRobot(robotName, nextPosition);
        }
      }
    });
  }

  /**
 * Conversion de l'index dans le tableau (GridPosition) en Coordonnée en Pixels (PixelPosition) pour l'affichage CSS
 *
 * @param grid
 * @returns
 */
  public override calculatePixelCoordinates(grid: GridPosition): PixelPosition {
    return new PixelPosition(
      grid.col * this.PIXELS_PER_STEP,  // col → x (left)
      grid.row * this.PIXELS_PER_STEP   // row → y (top)
    );
  }

  /** Méthodes propres au robot Aspirateur: */

  // Fonction principale pour nettoyer la maison
  private nettoyer(robotModelInput: RobotAspirator): GridPosition {
    console.log("RobotActionAspiratorService - nettoyer()");

    const maisonModel: CellElement[][] = this.cellStore.maisonGrid();
    if (!maisonModel) return new GridPosition();

    // Dé-réserver la position actuelle:
    this.maisonDataNettoyageService.updateReservedCell(robotModelInput.position, false);

    // 1 - Chercher la prochaine case non visitée en vue (pas forcément la case adjacente !)
    let prochaineCaseNonVisitee: CellElement | null = this.algoNettoyageService.trouverProchaineDestination(this.cellStore.maisonGrid(), robotModelInput.position);
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
    }

    // 2 - Recherche de la prochaine case adjacente à parcourir en direction de la prochaine case non visitée ciblée

    // Utiliser un algorithme de recherche de chemin optimal
    // On récupère la position 0 du chemin vers une position non nettoyée et (de préférence) non réservée avant
    let nextPositionNettoyage: GridPosition = this.algoNettoyageService.trouverPositionSuivante(
      this.cellStore.maisonGrid(), robotModelInput.position, prochaineCaseNonVisitee.position
    );

    console.log("nextPositionNettoyage :" + nextPositionNettoyage);
    if (!nextPositionNettoyage) {
      console.log("Impossible de trouver un chemin vers la destination");
      return robotModelInput.position;
    }

    // On recherche la cellule correspondant à partir de la position suivante trouvée
    let nextCellNettoyage: CellElement | undefined = this.getCellAt(nextPositionNettoyage);
    if (!nextCellNettoyage) {
      console.log("Impossible de trouver la cellule correspondant à la position (row: " + robotModelInput.position.row + ", col: " + robotModelInput.position.col);
      return robotModelInput.position;
    }

    // Position non réservée trouvée ! Est-elle disponible (non-réservée) ?
    if (!nextCellNettoyage.reserved) {
      return nextPositionNettoyage;
    }

    // Sinon, recherche d'une autre position au hasard, autour du joueur
    const cellulesVoisines = this.algoNettoyageService.obtenirCellulesAdjacentes(this.cellStore.maisonGrid(), robotModelInput.position);

    const celluleRandom = this.algoNettoyageService.obtenirRandomCellVoisine(cellulesVoisines);

    if (!celluleRandom?.reserved) {
      console.log("random cell non réservée trouvée !");

      return celluleRandom!.position;
    }
    return nextPositionNettoyage;
  }

  private activateReturnToBase(robot: RobotAspirator): void {
    console.log("RobotActionAspiratorService - activateReturnToBase()");

    const nextPosition = this.retournerALaBase(robot);
    if (!nextPosition) {
      this.robotAspiratorDataService.stopRobot(robot.robotName);
      return;
    }

    // MAJ du robot: retour à la base
    this.robotAspiratorDataService.moveRobotReturningToBase(robot.robotName, robot.position, nextPosition);

    console.log(`### Nouvelle position de retour à la base trouvée pour le Robot ${robot.robotName} : row = ${nextPosition.col}, col = ${nextPosition.row} - Batterie: ${robot.batterie}%`);
  }

  // Retourner à la base de charge
  private retournerALaBase(robotModelInput: RobotAspirator): GridPosition {
    console.log("RobotActionAspiratorService - retournerALaBase()");
    console.log("Retour à la base de charge");

    const maisonModel: CellElement[][] = this.cellStore.maisonGrid();
    if (!maisonModel) return new GridPosition();

    // Trouver le chemin vers la base
    const positionRetourALaBase: GridPosition = this.algoNettoyageService.trouverPositionSuivante(this.cellStore.maisonGrid(), robotModelInput.position, robotModelInput.basePosition);
    console.log("nextPosition :" + positionRetourALaBase);

    if (!positionRetourALaBase) {
      console.log("Impossible de trouver un chemin vers la base de charge!");
      return robotModelInput.position;
    }

    return positionRetourALaBase;
  }

  private robotDoitRentrerALaBase(batterie: number, position: GridPosition, basePosition: GridPosition, consommationParMouvement: number): boolean {
    console.log("RobotActionAspiratorService - robotDoitRentrerALaBase()");

    return (position && batterie <= this.energieNecessairePourRetour(position, basePosition, consommationParMouvement)) ?
      true : false;
  }

  // Estimer l'énergie nécessaire au robot pour retourner à la base
  private energieNecessairePourRetour(position: GridPosition, basePosition: GridPosition, consommationParMouvement: number): number {
    console.log("RobotActionAspiratorService - energieNecessairePourRetour()");

    const maisonModel: CellElement[][] = this.cellStore.maisonGrid();
    if (!maisonModel) return -1;

    // Estimer la distance jusqu'à la base (la distance de Manhattan ne suffit pas car elle ne tient pas compte des obstacles)
    const distance = this.algoNettoyageService.distanceDeLaBase(this.cellStore.maisonGrid(), position, basePosition);
    console.log("distance minimale de la base = " + distance);

    // Ajouter une marge de sécurité si on veut:
    return (distance * consommationParMouvement) * 1;
  }

  // TODO: revoir CSS de la maison si on affiche ces logs dans l'ihm
  private log(message: string) {
    this.loggerService.add(`RobotActionAspiratorService: ${message} `);
  }

  /**
   * Recherche d'un objet de type Cellule à partir de sa position
   *
   * @param position
   * @returns
   */
  private getCellAt(position: GridPosition): CellElement | undefined {
    //  Lecture ponctuelle de l'état courant des cellules du store
    return this.cellStore.cells()?.find(cell =>
      cell.position.col === position.col &&
      cell.position.row === position.row
    );
  }
}
