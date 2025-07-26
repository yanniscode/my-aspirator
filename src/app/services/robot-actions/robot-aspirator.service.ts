import { Injectable } from '@angular/core';
import { Position } from '../../classes/position';
import { RobotServiceData } from '../../classes/RobotServiceData';

import { AppComponent } from '../../components/app.component';
import { map, Observable, Subject, Subscription, takeWhile, tap, timer } from 'rxjs';
import { CheminOptimalService } from '../algo-services/chemin-optimal.service';
import { MessageService } from '../message.service';

@Injectable({
  providedIn: 'root'
})
export class RobotAspiratorService {

  public messageService: MessageService;

  // 3. Subject pour émettre les mises à jour de position
  private robotPositionSubject: Subject<RobotServiceData>;
  public robotPosition$: Observable<RobotServiceData>;

  // TODO: supprimer après modif de retour à la base:
  private updateSubscriptionSeDeplacerVers?: Subscription;

  // TODO: supprimer var si non-utilisées
  private isRobotStarted: boolean = false;
  // Position actuelle
  private position: Position = { x: 0, y: 0 };
  // Niveau de batterie (en pourcentage)
  private batterie: number = 0;

  private cheminRestant: Position[] = [];
  private isNettoyageComplete: boolean = false;

  private cheminOptimalService: CheminOptimalService;

  constructor(messageService: MessageService) {
    this.messageService = messageService;

    this.robotPositionSubject = new Subject<RobotServiceData>();
    this.robotPosition$ = this.robotPositionSubject.asObservable();

    this.cheminOptimalService = new CheminOptimalService();
  }

  ngOnDestroy(): void {
    if (this.updateSubscriptionSeDeplacerVers) {
      this.updateSubscriptionSeDeplacerVers.unsubscribe();
    }

    if (this.robotPositionSubject) {
      this.robotPositionSubject.unsubscribe();
    }
  }

  public log(message: string) {
    this.messageService.add(`RobotAspiratorService: ${message}`);
  }

  public onPause(): void {
    this.isRobotStarted = false;

    if (this.updateSubscriptionSeDeplacerVers) {
      this.updateSubscriptionSeDeplacerVers.unsubscribe();
    }
    if (this.robotPositionSubject) {
      this.robotPositionSubject.unsubscribe();
    }
  }

  // *************

  // TODO: à simplifier ?
  public nettoyerAvecControle(
    isRetourAlaBase: boolean,
    position: Position,
    batterie: number,
    isRobotStarted: boolean,
    consommationParMouvement: number,
    intervalMs: number = 500
  ): Observable<RobotServiceData> {

    if (this.robotPositionSubject.closed) {
      this.robotPositionSubject = new Subject<RobotServiceData>();
      this.robotPosition$ = this.robotPositionSubject.asObservable();
    }

    this.position = { ...position };
    this.batterie = batterie;
    this.isRobotStarted = isRobotStarted;
    this.cheminRestant = [];
    this.isNettoyageComplete = false;

    // Calculer le chemin initial
    this.calculateNextPath(isRetourAlaBase);

    // Utiliser un timer régulier pour l'animation
    return timer(0, intervalMs).pipe(
      map(() => this.processNextMove(consommationParMouvement, isRetourAlaBase)),
      takeWhile(result => !result.isNettoyageComplete && this.batterie > 0, true),
      tap(result => {
        // Émettre la mise à jour de position
        if (result.positions.length > 0) {
          this.robotPositionSubject.next(result);
        }
      })
    );
  }

  private calculateNextPath(isRetourAlaBase: boolean): void {
    const prochaineCellule = this.cheminOptimalService.trouverProchaineDestination(this.position);
    console.log(prochaineCellule);

    // isRetourAlaBase n'est vrai ici que si prochaineCellule est null ou undefined
    if (prochaineCellule || isRetourAlaBase) {

      let finChemin: Position = !isRetourAlaBase ? { ...prochaineCellule!.cellStack[0]!.position } : { ...AppComponent.basePosition };

      const chemin = this.cheminOptimalService.trouverChemin(this.position, finChemin);
      console.log(chemin);

      this.cheminRestant = chemin.map(pos => ({ ...pos }));
      console.log(this.cheminRestant);

      // console.log("Nouveau chemin calculé vers:", prochaineCellule.cellStack[0].position);
    } else {
      console.log("RobotAspiratorService - Aucune cellule accessible non visitée trouvée");
      this.isNettoyageComplete = true;
      this.cheminRestant = [];
    }
  }

  private processNextMove(consommationParMouvement: number, isRetourAlaBase: boolean): RobotServiceData {

    this.log("########## processNextMove");

    let robotServiceData: RobotServiceData = {
      // on actualise ici le niveau de batterie
      batterie: this.batterie,
      isNettoyageComplete: false,
      positions: []
    };

    // TODO: pb de batterie ici si = 0.5 au départ, par ex:
    this.log(this.batterie.toString());
    // TODO : doublon avec AppComponent où il faut passer la modif de batterie: à supprimer ici:
    this.batterie -= consommationParMouvement;
    robotServiceData.batterie = this.batterie;

    // console.log(robotServiceData);

    // Vérifier les conditions d'arrêt
    if (!this.isRobotStarted || this.isNettoyageComplete) {

      robotServiceData.isNettoyageComplete = true;
      return robotServiceData;
    }

    // Si le chemin actuel est terminé, chercher la prochaine destination
    // Cette action est valable seulement si isRetourAlaBase = false;
    if (this.cheminRestant.length === 0 && isRetourAlaBase === false) {
      this.calculateNextPath(false);

      // Après calcul du nouveau chemin, actualisant this.cheminRestant, si aucune nouvelle destination n'est trouvée
      if (this.cheminRestant.length === 0) {
        robotServiceData.isNettoyageComplete = true;
        return robotServiceData;
      }

    }

    if (this.cheminRestant.length !== 0) {
      // Prendre la prochaine position du chemin actuel
      const nextPosition = this.cheminRestant.shift()!;
      const lastPos = { ...this.position };

      // Mettre à jour la position
      this.position = { ...nextPosition };

      this.log(`Déplacement vers (${this.position.x}, ${this.position.y}). Batterie: ${this.batterie.toFixed(1)}%`);

      robotServiceData.positions = [lastPos, this.position];
      robotServiceData.isNettoyageComplete = false;
    }

    return robotServiceData;
  }

  // Estimer l'énergie nécessaire pour retourner à la base
  public energieNecessairePourRetour(position: Position, consommationParMouvement: number): number {
    // Estimer la distance jusqu'à la base
    const distance = this.cheminOptimalService.distance(position, AppComponent.basePosition);
    this.log("distance minimale de la base = "+ distance);
    // Ajouter une marge de sécurité
    return (distance * consommationParMouvement) * 1.2;
  }

}
