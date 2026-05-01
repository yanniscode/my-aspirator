import { computed, inject, Injectable, Signal, WritableSignal } from '@angular/core';
import { CellElement } from '../../../../classes/models/cellElement';
import { GridPosition } from '../../../../classes/models/grid-position';
import { PixelPosition } from '../../../../classes/models/pixel-position';
import { RobotActionService } from '../robot-action.service';
import { AlgoNettoyageService } from '../../robot-algos-deplacement-services/algo-nettoyage-service/algo-nettoyage.service';
import { MaisonDataNettoyageService } from '../../../maison-services/maison-data-services/maison-data-nettoyage-service/maison-data-nettoyage.service';
import { AspiromanModel } from '../../../../classes/models/robot-model/aspiroman-model/aspiroman-model';
import { MaisonModel } from '../../../../classes/models/maison-model/maison-model';
import { RobotAspiromanDataService } from '../../robot-data-services/robot-aspiroman-data-service/robot-aspiroman-data.service';

@Injectable({
  providedIn: 'root'
})
export class RobotActionAspiromanService extends RobotActionService {

  protected algoNettoyageService = inject(AlgoNettoyageService);

  private robotAspiromanDataService = inject(RobotAspiromanDataService);
  private maisonDataNettoyageService = inject(MaisonDataNettoyageService);

  // Map en lecture seule pour stocker les signaux computed de chaque robot à afficher
  private readonly _robotSignals: Map<string, WritableSignal<AspiromanModel>>
    = this.robotAspiromanDataService.aspiromanSignals as Map<string, WritableSignal<AspiromanModel>>;
  public robotSignals: Map<string, Signal<AspiromanModel>> = this._robotSignals;

  public readonly maisonSignal: Signal<MaisonModel> = computed(() =>
    this.maisonDataNettoyageService.maisonSignal()
  );

  // Configuration de l'animation
  private PIXELS_PER_STEP: number = 0; // Pixels à parcourir dans un intervale donné

  constructor() {
    console.log("RobotActionAspiromanService - constructor()");
    super();
    this.PIXELS_PER_STEP = 50;
  }

  /**
   * Calcule de nouvelles directions pour la Map de robots
   */
  public calculateNewDirectionsForAllRobots(): void {
    console.log("RobotActionAspiromanService - calculateNewDirectionsForAllRobots()");

    if (this._robotSignals.size <= 0) return;

    // Parcourt tous les robots
    this._robotSignals.forEach((robotSignal: WritableSignal<AspiromanModel>, robotName) => {

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

        this.stopRobot(robotName);
        return;
      }
      else if (robot.batterie > 0) {

        if (robot.isRobotReturningToBase) {

          if (robot.position.col === robot.basePosition.col && robot.position.row === robot.basePosition.row) {
            this.stopRobot(robotName);
            console.log("Arrêt effectué - retour à la base accomplit !");
            return;
          }

          this.activateReturnToBase(robot);
          return;
        }
        else if (this.maisonDataNettoyageService.toutEstVisite()) {

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
          this.moveRobot(robotName, nextPosition);
        }
      }
    });
  }

  /**
   * Activation du retour à la base
   *
   * @param robot
   * @returns
   */
  protected activateReturnToBase(robot: AspiromanModel): void {
    console.log("RobotActionAspiromanService - activateReturnToBase()");

    const nextPosition = this.retournerALaBase(robot);
    if (!nextPosition) {
      this.stopRobot(robot.robotName);
      return;
    }

    // MAJ du robot: retour à la base
    this.moveRobotReturningToBase(robot.robotName, robot.position, nextPosition);

    console.log(`### Nouvelle position de retour à la base trouvée pour le Robot ${robot.robotName} : row = ${nextPosition.col}, col = ${nextPosition.row} - Batterie: ${robot.batterie}%`);
  }

  /**
  * Déplace manuellement un robot à une position
  */
  protected moveRobot(robotName: string, nextPosition: GridPosition): void {
    console.log("RobotActionAspiromanService - moveRobot()");

    const robotSignal: WritableSignal<AspiromanModel> | undefined = this._robotSignals.get(robotName);
    if (!robotSignal) return;

    const robot = robotSignal();
    if (!robot) return;

    robotSignal.update(robot => ({
      ...robot,
      isRobotStarted: true,
      isRobotReturningToBase: false,                                        // le robot ne rentre pas à la base
      robotDirection: this.getRobotDirection(robot.position, nextPosition),
      lastPosition: { ...robot.position },                                  // la précédente position est modifiée avec l'actuelle
      position: { ...nextPosition },                                        // la nouvelle position prend sa valeur suivante
      batterie: robot.batterie - robot.consommationParMouvement
    }));
    console.log(`### ${robotName}: tableau[${nextPosition.col},${nextPosition.row}]- batterie(${robot.batterie})`);
  }

  /**
   * Déplacement du robot vers sa base de charge
   *
   * @param robotName
   * @param position
   * @param nextPosition
   * @returns
   */
  protected moveRobotReturningToBase(robotName: string, position: GridPosition, nextPosition: GridPosition): void {
    console.log("RobotActionAspiromanService - moveRobotReturningToBase()");

    const robotSignal: WritableSignal<AspiromanModel> | undefined = this._robotSignals.get(robotName);
    if (!robotSignal) return;

    const robot = robotSignal();

    const newStartCoordinate: PixelPosition = this.robotAspiromanDataService.calculatePixelCoordinates(position);
    const newTargetCoordinate: PixelPosition = this.robotAspiromanDataService.calculatePixelCoordinates(nextPosition);

    if (newStartCoordinate.x !== newTargetCoordinate.x || newStartCoordinate.y !== newTargetCoordinate.y) {
      robotSignal.update(robot => ({
        ...robot,
        isRobotStarted: true,
        isRobotReturningToBase: true,
        robotDirection: this.getRobotDirection(robot.position, nextPosition),
        lastPosition: { ...robot.position },  // la précédente position est modifiée avec l'actuelle
        position: { ...nextPosition },        // la nouvelle position prend sa valeur suivante
        batterie: robot.batterie - robot.consommationParMouvement
      }));
      console.log(`### ${robotName}: tableau [${nextPosition.col},${nextPosition.row}] → pixels (${newTargetCoordinate.x}, ${newTargetCoordinate.y}) - batterie (${robot.batterie})`);
    } else {
      this.stopRobot(robotName);
    }
  }

  /**
   * Arrêt d'un robot à une position
   *
   * @param robotName
   * @param position
   * @param nextPosition
   * @returns
   */
  protected stopRobot(robotName: string): void {
    console.log("RobotActionAspiromanService - stopRobot()");

    const robotSignal: WritableSignal<AspiromanModel> | undefined = this._robotSignals.get(robotName);
    if (!robotSignal) return;

    robotSignal.update(robot => ({
      ...robot,
      isRobotStarted: false,
    }));
  }

  /** Méthodes propres au robot Aspirateur: */

  /**
   * Fonction principale pour nettoyer la maison
   *
   * @param robotModelInput
   * @returns
   */
  private nettoyer(robotModelInput: AspiromanModel): GridPosition {
    console.log("RobotActionAspiromanService - nettoyer()");

    const maisonModel: MaisonModel = this.maisonSignal();
    if (!maisonModel) return new GridPosition();

    // Dé-réserver la position actuelle:
    this.maisonDataNettoyageService.updateReservedCell(robotModelInput.position, false);

    // Chercher la prochaine case non visitée
    let prochaineCaseNonVisitee: CellElement | null = this.algoNettoyageService.trouverProchaineDestination(maisonModel.maison, robotModelInput.position);
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

    // Utiliser un algorithme de recherche de chemin optimal pour rechercher le pas suivant du robot
    // on récupère la position 0 du chemin vers une position non nettoyée et (de préférence) non réservée avant
    let nextPositionNettoyage: GridPosition = this.algoNettoyageService.trouverPositionSuivante(
      maisonModel.maison, robotModelInput.position, prochaineCaseNonVisitee.position
    );

    console.log("nextPositionNettoyage :" + nextPositionNettoyage);
    if (!nextPositionNettoyage) {
      console.log("Impossible de trouver un chemin vers la destination");
      return robotModelInput.position;
    }

    // on recherche la cellule correspondant à la position suivante dans la maison pour vérifier son status réservé ou non
    const cellulesVoisines = this.algoNettoyageService.obtenirCellulesAdjacentes(maisonModel.maison, nextPositionNettoyage);
    let nextCellNettoyage: CellElement = new CellElement();
    for (const celluleVoisine of cellulesVoisines) {
      if (celluleVoisine.position.col === nextPositionNettoyage.col && celluleVoisine.position.row === nextPositionNettoyage.row)
        // copie par référence:
        nextCellNettoyage = celluleVoisine;
    }
    if (!nextCellNettoyage.reserved) {
      // Réserver la position non-visitée la plus proche, si elle est accessible
      this.maisonDataNettoyageService.updateReservedCell(nextPositionNettoyage, true);
    }

    return nextPositionNettoyage;
  }

  /**
   * Retourner à la base de charge
   *
   * @param robotModelInput
   * @returns
   */
  protected retournerALaBase(robotModelInput: AspiromanModel): GridPosition {
    console.log("RobotActionAspiromanServices - retournerALaBase()");
    console.log("Retour à la base de charge");

    const maisonModel: MaisonModel = this.maisonSignal();
    if (!maisonModel) return new GridPosition();

    // Trouver le chemin vers la base
    const positionRetourALaBase: GridPosition = this.algoNettoyageService.trouverPositionSuivante(maisonModel.maison, robotModelInput.position, robotModelInput.basePosition);
    console.log("nextPosition :" + positionRetourALaBase);

    if (!positionRetourALaBase) {
      console.log("Impossible de trouver un chemin vers la base de charge!");
      return robotModelInput.position;
    }

    return positionRetourALaBase;
  }

  /**
   * Déterminer si le robot doit rentrer ou non à sa base de charge
   *
   * @param batterie
   * @param position
   * @param basePosition
   * @param consommationParMouvement
   * @returns
   */
  protected robotDoitRentrerALaBase(batterie: number, position: GridPosition, basePosition: GridPosition, consommationParMouvement: number): boolean {
    console.log("RobotActionAspiromanService - robotDoitRentrerALaBase()");

    return (position && batterie <= this.energieNecessairePourRetour(position, basePosition, consommationParMouvement)) ?
      true : false;
  }

  /**
   * Estimer l'énergie nécessaire au robot pour retourner à la base
   *
   * @param position
   * @param basePosition
   * @param consommationParMouvement
   * @returns
   */
  protected energieNecessairePourRetour(position: GridPosition, basePosition: GridPosition, consommationParMouvement: number): number {
    // console.log("RobotActionAspiromanService - energieNecessairePourRetour()");

    const maisonModel: MaisonModel = this.maisonSignal();
    if (!maisonModel) return -1;

    // Estimer la distance jusqu'à la base (la distance de Manhattan ne suffit pas car elle ne tient pas compte des obstacles)
    const distance = this.algoNettoyageService.distanceDeLaBase(maisonModel.maison, position, basePosition);
    console.log("distance minimale de la base = " + distance);

    // Ajouter une marge de sécurité si on veut:
    return (distance * consommationParMouvement) * 1;
  }

  /**
   * Conversion de l'index dans le tableau (GridPosition) en Coordonnée en Pixels (PixelPosition) pour l'affichage CSS
   *
   * @param grid
   * @returns
   */
  public calculatePixelCoordinates(grid: GridPosition): PixelPosition {
    // console.log("RobotActionAspiromanService - calculatePixelCoordinates()");

    return new PixelPosition(
      grid.col * this.PIXELS_PER_STEP,  // col → x (left)
      grid.row * this.PIXELS_PER_STEP   // row → y (top)
    );
  }

  /**
   * MAJ des position visitée de la maison
   */
  public updateRobotsVisitedCells(): void {
    console.log("RobotActionAspiromanService - updateRobotsVisitedCells()");

    this._robotSignals.forEach((robotSignal) => {
      const robot: AspiromanModel = robotSignal();
      this.maisonDataNettoyageService.updateVisitedCell(robot.lastPosition, true);
    });
  }

  // TODO: revoir CSS de la maison si on affiche ces logs dans l'ihm
  /**
   * Méthode de logs(affichables s)
   *
   * @param message
   */
  private log(message: string) {
    this.loggerService.add(`RobotActionAspiromanService: ${message} `);
  }
}
