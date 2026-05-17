import { computed, inject, Injectable, signal, Signal, WritableSignal } from '@angular/core';
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
export abstract class RobotActionAspiromanService extends RobotActionService {

  protected algoNettoyageService = inject(AlgoNettoyageService);

  private robotAspiromanDataService = inject(RobotAspiromanDataService);
  private maisonDataNettoyageService = inject(MaisonDataNettoyageService);

  // Map en lecture seule pour stocker les signaux computed de chaque robot à afficher
  private readonly aspiromanSignals: Map<string, WritableSignal<AspiromanModel>>
    = this.robotAspiromanDataService.aspiromanSignals;

  public readonly maisonSignal: Signal<MaisonModel> = computed(() =>
    this.maisonDataNettoyageService.maisonSignal()
  );

  private readonly CELL_SIZE = 50;        // td-maison: width / height: 50px

  // Configuration de l'animation
  private PIXELS_PER_STEP: number = 0; // Pixels à parcourir dans un intervale donné

  public _playerMove: WritableSignal<string> = signal("");
  public playerMove: Signal<string> = this._playerMove.asReadonly();

  constructor() {
    console.log("RobotActionAspiromanService - constructor()");
    super();
    this.serviceName = "RobotActionAspiromanService";
    this.PIXELS_PER_STEP = 50;
  }

  public override calculateNewDirectionsForAllRobots(): void {
    console.log("RobotActionAspiromanService - calculateNewDirectionsForAllRobots()");
    this.moveRobot('Player 1');
  }

  /**
   * Déplace manuellement un robot à une position
   */
  public override moveRobot(robotName: string): void {
    console.log("RobotActionAspiromanService - moveRobot()");

    const robotSignal: WritableSignal<AspiromanModel> | undefined = this.aspiromanSignals.get(robotName);
    if (!robotSignal) return;

    const robot = robotSignal();
    if (!robot) return;

    const mouvement = this._playerMove();
    console.log("mouvement = " + mouvement);

    let nextPosition: GridPosition = new GridPosition();
    let isRobotStarted = true;
    let robotDirection = "";
    let batterie = robot.batterie;

    if (robot.batterie <= 0) {
      nextPosition = { ...robot.position };
      isRobotStarted = false;
    } else {
      nextPosition = this.algoNettoyageService.obtenirPositionManuelleSuivante(mouvement, robot.position, this.maisonSignal().maison);
      robotDirection = this.getRobotDirectionByDirection(mouvement);
      batterie -= robot.consommationParMouvement;
    }

    const isFirstMove =
      robot.targetCoordinate.x === 0 && robot.targetCoordinate.y === 0;

    const startX = isFirstMove
      ? robot.position.col * this.CELL_SIZE
      : robot.targetCoordinate.x;
    const startY = isFirstMove
      ? robot.position.row * this.CELL_SIZE
      : robot.targetCoordinate.y;

    // targetCoordinate = la destination en pixels du nouveau step
    const targetX = nextPosition.col * this.CELL_SIZE;
    const targetY = nextPosition.row * this.CELL_SIZE;
    // ─────────────────────────────────────────────────────────────────────────

    robotSignal.update(robot => ({
      ...robot,
      isRobotStarted: isRobotStarted,
      isRobotReturningToBase: false,
      robotDirection: robotDirection,
      lastPosition: { ...robot.position },
      position: { ...nextPosition },
      batterie: batterie,
      // ✅ coordonnées pixel pour l'interpolation dans drawObject
      startCoordinate: { x: startX, y: startY },
      targetCoordinate: { x: targetX, y: targetY },
    }));

    console.log(`### ${robotName}: moveRobot nextPosition[${nextPosition.col},${nextPosition.row}] - batterie(${robot.batterie})`);

    this._playerMove.set("");
  }

  /**
 * Arrêt d'un robot à une position
 *
 * @param robotName
 * @param position
 * @param nextPosition
 * @returns
 */
  public override stopRobot(robotName: string): void {
    console.log("RobotActionAspiromanService - stopRobot()");

    const robotSignal: WritableSignal<AspiromanModel> | undefined = this.aspiromanSignals.get(robotName);
    if (!robotSignal) return;

    robotSignal.update(robot => ({
      ...robot,
      isRobotStarted: false,
    }));
  }

  /**
   * Conversion de l'index dans le tableau (GridPosition) en Coordonnée en Pixels (PixelPosition) pour l'affichage CSS
   *
   * @param grid
   * @returns
   */
  public override calculatePixelCoordinates(grid: GridPosition): PixelPosition {
    // console.log("RobotActionAspiromanService - calculatePixelCoordinates()");

    return new PixelPosition(
      grid.col * this.PIXELS_PER_STEP,  // col → x (left)
      grid.row * this.PIXELS_PER_STEP   // row → y (top)
    );
  }

  /**
   * MAJ des positions visitées de la maison
   */
  public override updateRobotsVisitedCells(): void {
    console.log("RobotActionAspiromanService - updateRobotsVisitedCells()");

    this.aspiromanSignals.forEach((robotSignal) => {
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
