import { Injectable } from '@angular/core';
import { Position } from '../../classes/position';
import { PositionResult } from '../../classes/positionResult';

import { AppComponent } from '../../components/app.component';
import { map, Observable, Subject, Subscription, takeWhile, tap, timer } from 'rxjs';
import { CheminOptimalService } from '../algo-services/chemin-optimal.service';

@Injectable({
  providedIn: 'root'
})
export class RobotAspiratorService {

  // 3. Subject pour émettre les mises à jour de position
  private robotPositionSubject: Subject<PositionResult>;
  public robotPosition$: Observable<PositionResult>;
  // TODO: supprimer après modif de retour à la base:
  private updateSubscriptionSeDeplacerVers?: Subscription;

  isRobotStarted: boolean = false;
  // Position actuelle
  position: Position = { x: 0, y: 0 };
  lastPosition: Position = { x: 0, y: 0 };
  // Niveau de batterie (en pourcentage)
  public batterie: number = 0;

  private cheminRestant: Position[] = [];
  private isNettoyageComplete: boolean = false;

  // Combien d'énergie est consommée par mouvement
  consommationParMouvement: number = 0;
  // Combien d'énergie est nécessaire pour retourner à la base
  // TODO: utiliser ??
  // private energieRetourBase: number;

  cheminOptimalService: CheminOptimalService;

  // todo: supprimer appel à appComponent ici
  constructor(private appComponent: AppComponent) {
    this.robotPositionSubject = new Subject<PositionResult>();
    this.robotPosition$ = this.robotPositionSubject.asObservable();

    this.appComponent = appComponent;
    this.cheminOptimalService = new CheminOptimalService();
  }

  ngOnDestroy(): void {
    if (this.updateSubscriptionSeDeplacerVers) {
      this.updateSubscriptionSeDeplacerVers.unsubscribe();
    }
    // ajout:
    this.robotPositionSubject.unsubscribe();
  }

  public onPause(): void {
    if (this.updateSubscriptionSeDeplacerVers) {
      this.updateSubscriptionSeDeplacerVers.unsubscribe();
    }
    this.robotPositionSubject.unsubscribe();

    this.isRobotStarted = false;
  }

  // *************

  public nettoyerAvecControle(
    position: Position,
    lastPosition: Position,
    batterie: number,
    isRobotStarted: boolean,
    consommationParMouvement: number,
    intervalMs: number = 500
  ): Observable<PositionResult> {
    this.robotPositionSubject = new Subject<PositionResult>();
    this.robotPosition$ = this.robotPositionSubject.asObservable();

    this.position = { ...position };
    this.lastPosition = { ...lastPosition };
    this.batterie = batterie;
    this.cheminRestant = [];
    this.isNettoyageComplete = false;

    // Calculer le chemin initial
    this.calculateNextPath();

    // Utiliser un timer régulier pour l'animation
    return timer(0, intervalMs).pipe(
      map(() => this.processNextMove(isRobotStarted, consommationParMouvement)),
      takeWhile(result => !result.isNettoyageComplete && this.batterie > 0, true),
      tap(result => {
        // Émettre la mise à jour de position
        if (result.positions.length > 0) {
          this.robotPositionSubject.next(result);
        }
      })
    );
  }

  private calculateNextPath(): void {
    const prochaineCellule = this.cheminOptimalService.trouverProchaineDestination(this.position);

    if (prochaineCellule) {
      const chemin = this.cheminOptimalService.trouverChemin(this.position, prochaineCellule.cellStack[0].position);
      console.log(chemin);
      this.cheminRestant = chemin.map(pos => ({ ...pos }));
      console.log(this.cheminRestant);

      console.log("Nouveau chemin calculé vers:", prochaineCellule.cellStack[0].position);
    } else {
      console.log("Aucune cellule accessible non visitée trouvée");
      this.isNettoyageComplete = true;
      this.cheminRestant = [];
    }
  }


  private processNextMove(
    isRobotStarted: boolean,
    consommationParMouvement: number
  ): PositionResult {
    // Vérifier les conditions d'arrêt
    if (!isRobotStarted
      || this.batterie <= 0
      || this.batterie <= this.cheminOptimalService.energieNecessairePourRetour(this.position, this.consommationParMouvement)
      || this.isNettoyageComplete) {
      return {
        positions: [],
        isNettoyageComplete: true
      };
    }

    // Si le chemin actuel est terminé, chercher la prochaine destination
    if (this.cheminRestant.length === 0) {
      this.calculateNextPath();

      // Si aucune nouvelle destination n'est trouvée
      if (this.cheminRestant.length === 0) {
        return {
          positions: [],
          isNettoyageComplete: true
        };
      }
    }

    // Prendre la prochaine position du chemin actuel
    const nextPosition = this.cheminRestant.shift()!;
    const lastPos = { ...this.position };

    // Mettre à jour la position
    this.position = { ...nextPosition };
    this.batterie -= consommationParMouvement;

    return {
      positions: [lastPos, this.position],
      isNettoyageComplete: false
    };
  }

  // Retourner à la base de charge
  public retournerALaBase(
    position: Position,
    lastPosition: Position,
    batterie: number,
    isRobotStarted: boolean,
    consommationParMouvement: number
  ): Observable<void> {
    return new Observable((observer) => {
      AppComponent.log("Retour à la base de charge");

      this.position = position;
      this.lastPosition = lastPosition;
      this.batterie = batterie;
      this.isRobotStarted = isRobotStarted;
      this.consommationParMouvement = consommationParMouvement; // Valeur arbitraire
      // this.energieRetourBase = 0; // Sera calculée dynamiquement

      // Trouver le chemin vers la base
      const chemin: Position[] = this.cheminOptimalService.trouverChemin(this.position, AppComponent.basePosition);
      if (chemin.length === 0) {
        AppComponent.log("Impossible de trouver un chemin vers la base de charge!");
      }

      // Suivre le chemin
      this.updateSubscriptionSeDeplacerVers = this.seDeplacerVers(chemin).subscribe({
        next: (pos) => {
          AppComponent.log('next suivreLeCheminVersLaBase...');

          // Mettre à jour la position
          this.position = { ...pos };
          // Réduire la batterie
          this.batterie -= this.consommationParMouvement;

          AppComponent.log(`Déplacement vers (${this.position.x}, ${this.position.y}). Batterie: ${this.batterie.toFixed(1)}%`);
        },
        error: (err) => {
          AppComponent.log('Erreur suivreLeCheminVersLaBase: ' + err);
        },
        complete: () => {
          AppComponent.log('complete suivreLeCheminVersLaBase');
          observer.complete();
          AppComponent.log("Arrivé à la base de charge avec une batterie de " + this.batterie.toFixed(1) + "%");
        }
      });
    });
  }

  // Se déplacer vers une cellule spécifique
  private seDeplacerVers(chemin: Position[]): Observable<Position> {
    return new Observable((observer) => {
      let index = 0;

      const intervalId = setInterval(() => {
        // maj de la position actuelle, qui devient l'ancienne
        console.log(chemin);
        console.log(this.lastPosition);
        console.log(this.position);
        this.lastPosition = { ...this.position };
        // Vérifier si nous avons assez de batterie
        if (this.batterie <= this.cheminOptimalService.energieNecessairePourRetour(this.position, this.consommationParMouvement)) {
          AppComponent.log("Batterie faible, interruption du déplacement");
          observer.complete();
        }
        // Suivre le chemin
        else if (index < chemin.length) {
          observer.next(chemin[index]);
          index++;
        } else {
          observer.complete(); // Termine l'observable après avoir émis tous les nombres
        }
      }, 500);

      // Gestion de l'annulation de l'intervalle si l'observable est désabonnée
      return () => {
        clearInterval(intervalId);
      };
    });
  }

}
