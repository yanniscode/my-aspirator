import { Component } from '@angular/core';
import { AppComponent } from '../app.component';
import { Observable, Subscription } from 'rxjs';
import { Position } from '../../classes/position';
import { Cell } from '../../classes/cell';

@Component({
  selector: 'app-robot-aspirator',
  imports: [],
  templateUrl: './robot-aspirator.component.html',
  styleUrl: './robot-aspirator.component.css'
})
export class RobotAspiratorComponent {
  private appComponent: AppComponent;

  static robot: RobotAspiratorComponent;
  static isRobotStarted: boolean = false;
  static robotAtLastPosition: RobotAspiratorComponent;

  // Position actuelle
  public position: Position;

  // Position
  aspiroX: number = 0;
  // ajout d'un décalage du robot au départ  Y += 32px:
  aspiroY: number = 0 + 32;

  // Niveau de batterie (en pourcentage)
  public batterie: number;
  // Combien d'énergie est consommée par mouvement
  private consommationParMouvement: number;
  // Combien d'énergie est nécessaire pour retourner à la base
  // TODO: utiliser ??
  // private energieRetourBase: number;

  constructor(appComponent: AppComponent) {
    this.appComponent = appComponent;

    this.position = { ...AppComponent.basePosition };
    this.batterie = 100;
    this.consommationParMouvement = 0.5; // Valeur arbitraire
    // this.energieRetourBase = 0; // Sera calculée dynamiquement
  }

  // Fonction principale pour nettoyer la maison
  public nettoyer(): Observable<void> {
    return new Observable((observer) => {
      const intervalId = setInterval(() => {
        // rafraîchissement de l'affichage de la maison avec le robot à sa nouvelle position
        // si la batterie est HS
        if (RobotAspiratorComponent.robot.batterie <= RobotAspiratorComponent.robot.energieNecessairePourRetour()) {
          observer.complete();
        }
        // si toutes les cellules accessibles sont visitées, on logge simplement
        if (AppComponent.toutEstNettoye()) {
          AppComponent.log("Toutes les zones accessibles sont nettoyées");
        }
        // // Chercher la prochaine cellule non visitée et s'y diriger
        const prochaineCellule = RobotAspiratorComponent.robot.trouverProchaineDestination();

        if (prochaineCellule) {
          RobotAspiratorComponent.robot.seDeplacerVers(prochaineCellule).subscribe({
            next: (pos: Position) => {
              if (RobotAspiratorComponent.robot.position.x !== pos.x || RobotAspiratorComponent.robot.position.y !== pos.y) {
                // marquer la cellule comme visitée + opérer le déplacement:
                this.deplacer(pos);
                AppComponent.log("seDeplacerVers");
                AppComponent.log("robotAtLastPosition : X =" + RobotAspiratorComponent.robotAtLastPosition.position.x + "/ Y = " + RobotAspiratorComponent.robotAtLastPosition.position.y);
                AppComponent.log("robot : X =" + RobotAspiratorComponent.robot.position.x + "/ Y = " + RobotAspiratorComponent.robot.position.y);
              }
            },
            error: (err: string) => {
              AppComponent.log('Erreur seDeplacerVers: ' + err);
            },
            complete: () => {
              AppComponent.log('complete seDeplacerVers: ok !');
            }
          });
        } else {
          // Si aucune cellule n'est trouvée, retourner à la base
          AppComponent.log("Aucune cellule accessible non visitée trouvée");
          // force ici la fin de l'observable
          observer.complete();
        }
      }, 280); // Émet une nouvelle valeur toutes les 250ms

      // Gestion de l'annulation de l'intervalle si l'observable est désabonné
      return () => {
        clearInterval(intervalId);
      };
    });
  }

  // Trouver la prochaine cellule accessible non visitée la plus proche
  private trouverProchaineDestination(): Cell | null {
    // Utiliser un algorithme de recherche en largeur (BFS) pour trouver la cellule non visitée la plus proche
    const queue: { cell: Cell; distance: number }[] = [];
    const visited: Set<string> = new Set();

    const positionKey = `${this.position.x},${this.position.y}`;
    visited.add(positionKey);

    // Ajouter les cellules adjacentes à la position actuelle
    this.obtenirCellulesAdjacentes(this.position).forEach(cell => {
      queue.push({ cell, distance: 1 });
      visited.add(`${cell.cellStack[0].position.x},${cell.cellStack[0].position.y}`);
    });

    while (queue.length > 0) {
      const { cell, distance } = queue.shift()!;

      // Si la cellule n'est pas visitée et n'est pas un obstacle, la retourner
      if (!cell.cellStack[0].visited && cell.cellStack[0].type !== 'X' && cell.cellStack[0].type !== 'B') {
        return cell;
      }

      // Si la distance est trop grande, ne pas continuer la recherche
      if (distance > 20) { // Une limite arbitraire pour éviter une boucle infinie
        continue;
      }

      // Ajouter les cellules adjacentes à la file d'attente
      this.obtenirCellulesAdjacentes(cell.cellStack[0].position).forEach(adjacentCell => {
        const key = `${adjacentCell.cellStack[0].position.x},${adjacentCell.cellStack[0].position.y}`;
        if (!visited.has(key)) {
          queue.push({ cell: adjacentCell, distance: distance + 1 });
          visited.add(key);
        }
      });
    }

    return null; // Aucune cellule non visitée accessible trouvée
  }

  // Obtenir les cellules adjacentes à une position
  private obtenirCellulesAdjacentes(position: Position): Cell[] {
    const directions = [
      { dx: 0, dy: -1 }, // Nord
      { dx: 1, dy: 0 },  // Est
      { dx: 0, dy: 1 },  // Sud
      { dx: -1, dy: 0 }  // Ouest
    ];

    const cellules: Cell[] = [];

    directions.forEach(dir => {
      const newX = position.x + dir.dx;
      const newY = position.y + dir.dy;

      // Vérifier si la nouvelle position est dans les limites de la maison
      if (
        newX >= 0 && newX < AppComponent.maison[0].length &&
        newY >= 0 && newY < AppComponent.maison.length
      ) {
        cellules.push(AppComponent.maison[newY][newX]);
      }
    });

    return cellules;
  }

  // Se déplacer vers une cellule spécifique
  private seDeplacerVers(destination: Cell): Observable<Position> {
    return new Observable((observer) => {

      // Utiliser A* ou un autre algorithme de recherche de chemin pour trouver le chemin optimal
      const chemin = this.trouverChemin(this.position, destination.cellStack[0].position);

      if (chemin.length === 0) {
        AppComponent.log("Impossible de trouver un chemin vers la destination");
        observer.complete();
      }

      let index = 0;
      const intervalId = setInterval(() => {
        RobotAspiratorComponent.robotAtLastPosition.position = { ...RobotAspiratorComponent.robot.position };
        // Suivre le chemin
        if (index < chemin.length) {
          observer.next(chemin[index]);
          // Vérifier si la batterie est suffisante pour continuer
          if (this.batterie <= this.energieNecessairePourRetour()) {
            AppComponent.log("Batterie faible, interruption du déplacement");
            observer.complete();
          }
          index++;
        }
      }, 500);

      // Gestion de l'annulation de l'intervalle si l'observable est désabonnée
      return () => {
        clearInterval(intervalId);
      };
    });

  }

  // Algorithme A* pour trouver le chemin optimal
  private trouverChemin(debut: Position, fin: Position): Position[] {
    // Structure pour représenter un nœud dans l'algorithme A*
    interface Node {
      position: Position;
      g: number; // Coût depuis le départ
      f: number; // Coût estimé total (g + h)
    }

    // Fonction pour créer une clé unique pour une position
    const positionKey = (pos: Position): string => `${pos.x},${pos.y}`;

    // Ensemble des nœuds à explorer (la file de priorité)
    const openSet: Node[] = [];

    // Ensemble des nœuds déjà explorés
    const closedSet = new Set<string>();

    // Map qui associe chaque position à son parent dans le chemin optimal
    const cameFrom = new Map<string, Position>();

    // Map qui stocke le coût g pour chaque position
    const gScore = new Map<string, number>();

    // Initialiser gScore avec des valeurs infinies
    for (let y = 0; y < AppComponent.maison.length; y++) {
      for (let x = 0; x < AppComponent.maison[0].length; x++) {
        gScore.set(`${x},${y}`, Infinity);
      }
    }

    // Coût du départ au départ est 0
    gScore.set(positionKey(debut), 0);

    // Ajouter le nœud de départ à openSet
    openSet.push({
      position: debut,
      g: 0,
      f: this.distance(debut, fin)
    });

    // Tant qu'il y a des nœuds à explorer
    while (openSet.length > 0) {
      // Trier openSet pour obtenir le nœud avec le plus petit f
      openSet.sort((a, b) => a.f - b.f);

      // Récupérer le nœud avec le plus petit f
      const current = openSet.shift()!;
      const currentKey = positionKey(current.position);

      // Si nous sommes arrivés à destination
      if (current.position.x === fin.x && current.position.y === fin.y) {
        // Reconstruire le chemin
        return this.reconstruireChemin(cameFrom, fin);
      }

      // Marquer le nœud comme exploré
      closedSet.add(currentKey);

      // Explorer les voisins
      const voisins = this.obtenirCellulesAdjacentes(current.position);

      for (const voisin of voisins) {
        // Ignorer les obstacles
        if (voisin.cellStack[0].type === 'X') continue;

        const voisinKey = positionKey(voisin.cellStack[0].position);

        // Ignorer si déjà exploré
        if (closedSet.has(voisinKey)) continue;

        // Calculer le nouveau score g tentative
        const tentativeGScore = gScore.get(currentKey)! + 1;

        // Vérifier si ce chemin est meilleur
        if (tentativeGScore < gScore.get(voisinKey)!) {
          // Ce chemin est meilleur, l'enregistrer
          cameFrom.set(voisinKey, current.position);
          gScore.set(voisinKey, tentativeGScore);

          // Calculer f = g + h
          const fScore = tentativeGScore + this.distance(voisin.cellStack[0].position, fin);

          // Vérifier si le voisin est déjà dans openSet
          const existingIndex = openSet.findIndex(node =>
            node.position.x === voisin.cellStack[0].position.x && node.position.y === voisin.cellStack[0].position.y
          );

          if (existingIndex !== -1) {
            // Mettre à jour les valeurs
            openSet[existingIndex].g = tentativeGScore;
            openSet[existingIndex].f = fScore;
          } else {
            // Ajouter à openSet
            openSet.push({
              position: voisin.cellStack[0].position,
              g: tentativeGScore,
              f: fScore
            });
          }
        }
      }

      // Protection anti-boucle infinie
      if (openSet.length > AppComponent.maison.length * AppComponent.maison[0].length) {
        console.error("Détection de boucle potentielle dans A*");
        break;
      }
    }

    // Aucun chemin trouvé
    console.log("Aucun chemin trouvé de", debut, "à", fin);
    return [];
  }

  // Méthode pour reconstruire le chemin
  private reconstruireChemin(cameFrom: Map<string, Position>, current: Position): Position[] {
    const chemin: Position[] = [];
    let currentPos = current;
    const positionKey = (pos: Position): string => `${pos.x},${pos.y}`;

    // Reconstruire le chemin en partant de la fin
    while (cameFrom.has(positionKey(currentPos))) {
      chemin.unshift(currentPos);
      currentPos = cameFrom.get(positionKey(currentPos))!;
    }

    // Enlever le premier nœud si c'est la position actuelle
    if (chemin.length > 0 &&
      chemin[0].x === this.position.x &&
      chemin[0].y === this.position.y) {
      chemin.shift();
    }

    return chemin;
  }

  // Calculer la distance entre deux positions (heuristique pour A*)
  private distance(a: Position, b: Position): number {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y); // Distance de Manhattan
  }

  // Estimer l'énergie nécessaire pour retourner à la base
  private energieNecessairePourRetour(): number {
    // Estimer la distance jusqu'à la base
    const distance = this.distance(this.position, AppComponent.basePosition);

    // Ajouter une marge de sécurité
    return (distance * this.consommationParMouvement) * 1.2;
  }

  // Retourner à la base de charge
  public retournerALaBase(): Observable<RobotAspiratorComponent> {
    return new Observable((observer) => {
      AppComponent.log("Retour à la base de charge");
      // Trouver le chemin vers la base
      const chemin = this.trouverChemin(this.position, AppComponent.basePosition);

      if (chemin.length === 0) {
        AppComponent.log("Impossible de trouver un chemin vers la base de charge!");
      }

      // Suivre le chemin
      this.suivreLeCheminVersLaBase(chemin).subscribe({
        next: (pos) => {
          AppComponent.log('next suivreLeCheminVersLaBase...');
          this.deplacer(pos);
          AppComponent.log("retour à la base");
          AppComponent.log("robot : X =" + RobotAspiratorComponent.robot.position.x + "/ Y = " + RobotAspiratorComponent.robot.position.y);
          observer.next(RobotAspiratorComponent.robot);
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

  private suivreLeCheminVersLaBase(chemin: Position[]): Observable<Position> {
    return new Observable((observer) => {
      let index = 0;

      const intervalId = setInterval(() => {
        // rafraîchissement de l'affichage de la maison avec le robot à sa nouvelle position
        RobotAspiratorComponent.robotAtLastPosition.position = { ...RobotAspiratorComponent.robot.position };
        // Vérifier si nous avons assez de batterie
        if (this.batterie <= 0) {
          AppComponent.log("Batterie épuisée avant d'atteindre la base!");
          observer.complete();
        }
        else if (index < chemin.length) {
          observer.next(chemin[index]);
          index++;
        } else {
          observer.complete(); // Termine l'observable après avoir émis tous les nombres
        }
      }, 500); // Émet une nouvelle valeur toutes les 250ms

      // Nettoyage de l'intervalle si l'abonnement est annulé
      return () => {
        clearInterval(intervalId);
      };
    });
  }

  // Déplacer le robot à une position spécifique
  private deplacer(position: Position): void {
    // Mettre à jour la position
    RobotAspiratorComponent.robot.position = { ...position };
    // Réduire la batterie
    RobotAspiratorComponent.robot.batterie -= this.consommationParMouvement;

    console.log(`Déplacement vers (${position.x}, ${position.y}). Batterie: ${RobotAspiratorComponent.robot.batterie.toFixed(1)}%`);

    AppComponent.log(`Déplacement vers (${position.x}, ${position.y}). Batterie: ${RobotAspiratorComponent.robot.batterie.toFixed(1)}%`);
    this.appComponent.updateMaisonWithRobot();

    // Marquer la cellule comme visitée
    setTimeout(() => {
      AppComponent.maison[position.y][position.x].cellStack[0].visited = true;
      AppComponent.maison[position.y][position.x].cellStack[0].type = '_';
    }, 250);
  }

  updateAspiroDirection(): Position {

    const aspiroDirX = (RobotAspiratorComponent.robot.position.x - RobotAspiratorComponent.robotAtLastPosition.position.x) === 1 ? 50 :
      (RobotAspiratorComponent.robot.position.x - RobotAspiratorComponent.robotAtLastPosition.position.x) === -1 ? -50 : 0;
    const aspiroDirY = (RobotAspiratorComponent.robot.position.y - RobotAspiratorComponent.robotAtLastPosition.position.y) === 1 ? 50 :
      (RobotAspiratorComponent.robot.position.y - RobotAspiratorComponent.robotAtLastPosition.position.y) === -1 ? -50 : 0;

    this.aspiroX += aspiroDirX;
    console.log(this.aspiroX);
    this.aspiroY += aspiroDirY;
    console.log(this.aspiroY);

    // TODO: à voir si nécessaire
    // this.moveTrigger++;
    return { x: this.aspiroX, y: this.aspiroY };
  }

}
