import { Injectable } from '@angular/core';
import { MessageService } from '../../message-service/message.service';
import { RobotAspiratorModel } from '../../../classes/models/robot-aspirator-model';
import { Observable } from 'rxjs';
import { CheminOptimalService } from '../../algo-services/chemin-optimal.service';
import { MaisonModel } from '../../../classes/models/maison-model';
import { Position } from '../../../classes/models/position';
import { Cell } from '../../../classes/models/cell';

@Injectable()
export class RobotAspiratorWithNextPositionService {

  private maisonModel: MaisonModel;
  private robot: RobotAspiratorModel;

  constructor(private messageService: MessageService, private cheminOptimalService: CheminOptimalService) {
    this.maisonModel = new MaisonModel();
    this.robot = new RobotAspiratorModel();
  }

  // V1
  // Fonction principale pour nettoyer la maison
  public nettoyer(maisonModelInput: MaisonModel, robotModelInput: RobotAspiratorModel): Observable<RobotAspiratorModel> {

    this.maisonModel = { ...maisonModelInput };
    this.robot = { ...robotModelInput }

    return new Observable((observer) => {

      // intervalle pour réactualiser le chemin et la position
      const intervalId = setInterval(() => {

        if (observer.closed) {
          return;
        }
        // si le robot revient à la base
        if (this.robot.isRobotReturningToBase) {
          observer.complete();
          return;
        }
        // si la batterie est HS
        else if (this.robot.batterie <= this.energieNecessairePourRetour(this.robot.position)) {
          observer.complete();
          return;
        }

        // si toutes les cellules accessibles sont visitées, on logge simplement
        if (this.toutEstNettoye()) {
          console.log("Toutes les zones accessibles sont nettoyées");
        }
        // Chercher la prochaine cellule non visitée et s'y diriger
        const prochaineCellule = this.cheminOptimalService.trouverProchaineDestination(this.maisonModel.maison, this.robot.position);
        console.log(prochaineCellule);

        // TODO: revoir ? effet de bord de setInterval nous ramène ici ?
        if (prochaineCellule) {

          // Utiliser A* ou un autre algorithme de recherche de chemin pour trouver le chemin optimal
          const nextPosition: Position = this.cheminOptimalService.trouverPositionSuivante(this.maisonModel.maison, this.robot.position, prochaineCellule.cellStack[0].position);
          console.log("nextPosition :" + nextPosition);

          if (nextPosition === undefined) {
            console.log("Impossible de trouver un chemin vers la destination");
            observer.complete();
            return;
          }

          // ** Dans cette version de l'algo: on prend la première position du chemin à chaque tour de boucle

          // marquer la cellule comme visitée + opérer le déplacement:
          this.robot = { ...this.deplacer(nextPosition) };

          observer.next(this.robot);

        } else {
          // Si aucune cellule n'est trouvée, retourner à la base
          console.log("Aucune cellule accessible non visitée trouvée");
          // on force ici la fin de l'observable
          observer.complete();
          return;
        }
      }, 500); // Émet une nouvelle valeur toutes les 280ms

      // Gestion de l'annulation de l'intervalle si l'observable est désabonné
      return () => {
        observer.complete();
        clearInterval(intervalId);
      };
    });
  }

  // algo V1
  // Retourner à la base de charge
  public retournerALaBase(maisonModelInput: MaisonModel, robotModelInput: RobotAspiratorModel): Observable<RobotAspiratorModel> {
    console.log('retournerALaBase()');

    this.maisonModel = { ...maisonModelInput };
    this.robot = { ...robotModelInput }

    return new Observable((observer) => {
      // intervalle pour réactualiser le chemin et la position
      const intervalId = setInterval(() => {

        console.log("Retour à la base de charge");
        console.log("intervalId = " + intervalId);

        // Trouver le chemin vers la base
        const nextPosition: Position = this.cheminOptimalService.trouverPositionSuivante(this.maisonModel.maison, this.robot.position, this.robot.basePosition);
        console.log("nextPosition :" + nextPosition);

        if (nextPosition === undefined) {
          console.log("Impossible de trouver un chemin vers la base de charge!");
          observer.complete();
          return;

        } else {
          // Suivre le chemin
          this.robot = this.deplacer(nextPosition);
          observer.next(this.robot);
        }
      }, 500); // Émet une nouvelle valeur toutes les 280ms

      // Gestion de l'annulation de l'intervalle si l'observable est désabonné
      return () => {
        observer.complete();
        clearInterval(intervalId);
      };
    });
  }

  // V1 :
  // Déplacer le robot à une position spécifique
  private deplacer(nextPosition: Position): RobotAspiratorModel {
    console.log(nextPosition);
    // nécessaire vérification de isRobotStarted dans la fonction synchrone appelée par une observable,
    // pour éviter de nouveaux tours de boucle à cause de la présence de setInterval() dans la fonction nettoyer()
    if (this.robot.isRobotStarted === false) {
      return this.robot;
    }
    else if (this.robotMustStop(nextPosition)) {
      console.log("Le robot ne peut aller plus loin : batterie insuffisante !");

      this.robot.isRobotReturningToBase = true;
      RobotAspiratorModel.logger(this.robot);

      return this.robot;
    }

    // Mettre à jour la position
    this.robot.lastPosition = { ...this.robot.position };
    this.robot.position = { ...nextPosition };

    // Réduire la batterie
    this.robot.batterie -= this.robot.consommationParMouvement;

    console.log(`Déplacement vers (${this.robot.position.x}, ${this.robot.position.y}). Batterie: ${this.robot.batterie.toFixed(1)}%`);

    return this.robot;
  }


  private robotMustStop(position: Position): boolean {
    return (position && this.robot.batterie <= this.energieNecessairePourRetour(position)) ?
      true : false;
  }

  // V2
  // Estimer l'énergie nécessaire au robot pour retourner à la base
  private energieNecessairePourRetour(position: Position): number {
    // Estimer la distance jusqu'à la base
    const distance = this.cheminOptimalService.distance(position, this.robot.basePosition);
    console.log("distance minimale de la base = " + distance);

    // Ajouter une marge de sécurité
    return (distance * this.robot.consommationParMouvement) * 1;
  }

  // V2
  // Vérifier si toutes les cellules accessibles ont été visitées
  private toutEstNettoye(): boolean {
    for (let i = 0; i < this.maisonModel.maison.length; i++) {
      for (let j = 0; j < this.maisonModel.maison[i].length; j++) {
        const cell: Cell = this.maisonModel.maison[i][j];
        if (cell.cellStack[0].type !== 'X' && cell.cellStack[0].type !== 'B' && !cell.cellStack[0].visited) {
          return false;
        }
      }
    }
    return true;
  }

  // TODO: revoir CSS de la maison si on affiche les logs dans l'ihm
  private log(message: string) {
    this.messageService.add(`RobotAspiratorBService: ${message}`);
  }
}
