import { computed, inject, Injectable, OnDestroy, signal, Signal, WritableSignal } from '@angular/core';
import { RobotModel } from '../../../classes/models/robot-model/robot-model';
import { RobotAspiratorDataService } from '../robot-data-services/robot-aspirator-data-service/robot-aspirator-data.service';
import { RobotDataService } from '../robot-data-services/robot-data.service';
import { RobotAspiromanDataService } from '../robot-data-services/robot-aspiroman-data-service/robot-aspiroman-data.service';
import { forkJoin, map, Observable, Subject, takeUntil, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class RobotDataFactoryService implements OnDestroy {

  private robotAspiratorDataService = inject(RobotAspiratorDataService);
  private robotAspiromanDataService = inject(RobotAspiromanDataService);

  // Pattern factory: tableau de Robot Data Services de type spécifiques vers un type générique
  private robotDataServicesTab: RobotDataService[] = [this.robotAspiratorDataService, this.robotAspiromanDataService];

  private endedSubscription$ = new Subject<void>();

  /**
  * Map en lecture seule pour stocker les signaux computed de chaque robot à afficher
  */
  /**
 * Map fusionnée en lecture des signaux de tous les services.
 * Utilisée par AnimationFactoryService, par exemple, pour accéder aux signaux par nom.
 * Note: pas réactive (Map brute) — utiliser robotNames() + getRobotSignal()
 * pour le template binding. Ici c'est suffisant pour l'animation.
 */
  public get robotSignals(): Map<string, Signal<RobotModel>> {
    const mergedMap = new Map<string, Signal<RobotModel>>();
    this.robotDataServicesTab.forEach(robotDataService => {
      robotDataService.robotSignals.forEach((signal, name) => mergedMap.set(name, signal));
    });
    return mergedMap;
  }

  /**
 * Recherche le signal d'un robot par son nom, en cherchant dans chaque service.
 */
  public getRobotSignal(robotName: string): Signal<RobotModel | undefined> {
    for (const robotDataService of this.robotDataServicesTab) {
      const robotSignal = robotDataService.getRobotSignal(robotName);
      if (robotSignal) return robotSignal;
    }
    return computed(() => undefined);
  }

  /**
   * Liste fusionnée des noms de robots, tous types confondus.
   * Se recalcule automatiquement dès qu'un des services ajoute/retire un robot.
   */
  public readonly robotNames: Signal<string[]> = computed(() => {
    return this.robotDataServicesTab.flatMap(robotDataService => robotDataService.robotNames());
  });

  /**
   * Lit les signaux individuels des services data des robots
   *
   * computed vérifiant si la map de robots est à l'état démarré
   * note: fonctionne ici, mais pas si on la place dans RobotDataService
   */
  public readonly hasActiveRobots: Signal<boolean> = computed(() =>
    this.robotDataServicesTab.some(robotDataService =>
      Array.from(robotDataService.robotSignals.values()).some(signal => signal()?.isRobotStarted)
    )
  );

  // Récupération du Signal pour le progress collectif (0 à 1) des bots
  public animationBotsProgSignal: WritableSignal<number> = signal(-1);
  // Récupération de la Map de Signaux pour le progress individuel (0 à 1) des joueurs
  public animationPlayerProgSignals: Map<string, WritableSignal<number>> = new Map<string, WritableSignal<number>>();

  constructor() {
    console.log("RobotDataFactoryService - constructor()");

    // Instanciation des signaux de la progression de l'animation des robots de tout type
    this.setRobotsAnimationProgSignals();
  }

  ngOnDestroy(): void {
    console.log("RobotDataFactoryService - ngOnDestroy()");
    this.endedSubscription$.next();
    this.endedSubscription$.complete();
  }

  /**
   * Renvoie la liste de services concernant les actions des personnages
   *
   * @returns
   */
  public getDataServicesTab(): RobotDataService[] {
    return this.robotDataServicesTab;
  }

  /**
   * Renvoie la Map de signaux contenant la direction de déplacement manuelle en cours de chaque Joueur
   *
   * @param playerName
   * @returns
   */
  public getPlayerMoveDirectionSignals(playerName: string) {
    console.log("ActionFactoryService - getPlayerMoveDirectionSignals()");

    return this.robotAspiromanDataService.playerMoveDirectionSignals.get(playerName);;
  }

  /**
   * Méthode de factory : renvoie les paramètres des robots avec un upcast vers le type générique RobotModel[]
   */
  public createRobotsParams(): Observable<void> {
    console.log("RobotDataFactoryService - createRobotsParams()");

    // initialisation des paramètres des robots
    const requests$: Observable<RobotModel[]>[] = this.robotDataServicesTab.map(robotDataService =>

      robotDataService.getJsonData().pipe(
        tap(data => {
          console.log("RobotDataFactoryService data");
          console.log(data);
          if (!data) return;

          let robotModelsTab: RobotModel[] = [...data];

          robotDataService.setRobotSignalsList(robotModelsTab);
          robotDataService.setRobotAspiratorBases(robotModelsTab);

          robotDataService.createPlayersActionParams();
        })
      )
    );

    return forkJoin(requests$).pipe(
      takeUntil(this.endedSubscription$),
      tap(() => this.initAnimationPlayersProgSignals()), // ✅  initialisation de la Map de signaux appelée une seule fois, tous les services chargés
      map(() => void 0)
    );
  }

  /**
 * Méthode de factory : crée les paramètres pour les services "Action" (les robots de type Joueur)
 */
  public createPlayersActionParams(): void {
    console.log("ActionFactoryService - createPlayersActionParams()");

    // Sélection des services des Joueurs à adapter selon les besoins (services de Joueurs)
    this.robotDataServicesTab.forEach(robotDataService => {
      if (robotDataService.serviceName === 'RobotAspiromanDataService') {
        console.log(robotDataService.serviceName);
        robotDataService.createPlayersActionParams();
      }
    });
  }

  /**
   * Méthode de factory qui intialise les signaux des players individualisés dans leur liste (pour synchroniser les données)
   *
   * @returns
   */
  public initAnimationPlayersProgSignals(): void {
    console.log("RobotDataFactoryService - buildRobotSignalsList()");

    this.robotDataServicesTab.forEach(robotDataService => {
      robotDataService.getRobotSignalsList().forEach(robotSignal => {

        if (robotSignal().robotType === "player") {
          this.animationPlayerProgSignals.set(robotSignal().robotName, signal(0));
        }
      });
    });
  }

  /**
  * Nettoye la map générique de signaux
  */
  public clearAllRobotsList(): void {
    console.log("RobotDataFactoryService - clearAllRobotsList()");
    this.robotDataServicesTab.forEach(robotDataService => {
      robotDataService.clearAllRobotsList();
    });
  }

  /**
   * Instanciation des signaux de la progression de l'animation à partir du type générique RobotDataService en non du type spécifique des robots
   * (comme on est dans une Factory)
   */
  private setRobotsAnimationProgSignals(): void {
    console.log("RobotDataFactoryService - buildRobotsAnimProgSignalsList()");

    this.robotDataServicesTab.forEach(robotDataService => {

      // Instanciation du signal de progression de l'animation individualisé des bots:
      if (robotDataService.serviceName === "RobotAspiratorDataService") {
        this.animationBotsProgSignal = this.robotAspiratorDataService._animationBotsProgSignal;
      }
      // Instanciation des signaux de progression de l'animation individualisés pour chaque robot joueur:
      if (robotDataService.serviceName === "RobotAspiromanDataService") {
        this.animationPlayerProgSignals = this.robotAspiromanDataService._animationPlayerProgSignals;
      }
    });
  }
}
