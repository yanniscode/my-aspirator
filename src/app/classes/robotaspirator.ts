import { Observable, Subscription } from "rxjs";
import { AppComponent } from "../app.component";
import { MessageService } from "../services/message.service";

import { Cell } from "./cell";
import { Position } from "./position";

type Direction = 'nord' | 'est' | 'sud' | 'ouest';

export class RobotAspirator {

  // nécessaire pour l'animation (écoute d'observable avec rxjs)
  private updateSubscription!: Subscription;

  // Position actuelle
  public position: Position;
  // Direction actuelle
  private direction: Direction;
  // Position de la base de charge
  private basePosition: Position;
  // Niveau de batterie (en pourcentage)
  public batterie: number;
  // Combien d'énergie est consommée par mouvement
  private consommationParMouvement: number;
  // Combien d'énergie est nécessaire pour retourner à la base
  // TODO: utiliser ??
  private energieRetourBase: number;

  constructor(messageService: MessageService, basePosition: Position);

  constructor(private messageService: MessageService, basePosition: Position) {
    this.messageService = messageService;

    this.basePosition = basePosition;
    this.position = { ...basePosition };
    this.direction = 'nord';
    this.batterie = 100;
    this.consommationParMouvement = 0.5; // Valeur arbitraire
    this.energieRetourBase = 0; // Sera calculée dynamiquement
  }

  // Trouver la prochaine cellule accessible non visitée la plus proche
  public trouverProchaineDestination(): Cell | null {
    // Utiliser un algorithme de recherche en largeur (BFS) pour trouver la cellule non visitée la plus proche
    const queue: { cell: Cell; distance: number }[] = [];
    const visited: Set<string> = new Set();

    const positionKey = `${this.position.x},${this.position.y}`;
    visited.add(positionKey);

    // Ajouter les cellules adjacentes à la position actuelle
    this.obtenirCellulesAdjacentes(this.position).forEach(cell => {
      queue.push({ cell, distance: 1 });
      visited.add(`${cell.position.x},${cell.position.y}`);
    });

    while (queue.length > 0) {
      const { cell, distance } = queue.shift()!;

      // Si la cellule n'est pas visitée et n'est pas un obstacle, la retourner
      if (!cell.visited && cell.type !== 'X' && cell.type !== 'B') {
        return cell;
      }

      // Si la distance est trop grande, ne pas continuer la recherche
      if (distance > 20) { // Une limite arbitraire pour éviter une boucle infinie
        continue;
      }

      // Ajouter les cellules adjacentes à la file d'attente
      this.obtenirCellulesAdjacentes(cell.position).forEach(adjacentCell => {
        const key = `${adjacentCell.position.x},${adjacentCell.position.y}`;
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
  public seDeplacerVers(robot: RobotAspirator, destination: Cell): RobotAspirator {
    // Utiliser A* ou un autre algorithme de recherche de chemin pour trouver le chemin optimal
    const chemin = this.trouverChemin(this.position, destination.position);

    if (chemin.length === 0) {
      this.log("Impossible de trouver un chemin vers la destination");
      return robot;
    }

    // Suivre le chemin
    for (const pos of chemin) {
      // renvoyer la nouvelle position du robot + la cellule marquée comme visitée
      robot = this.deplacer(robot, pos);

      this.log("seDeplacerVers");
      this.log("robot : X =" + robot.position.x + "/ Y = " + robot.position.y);

      // Vérifier si la batterie est suffisante pour continuer
      if (this.batterie <= this.energieNecessairePourRetour()) {
        this.log("Batterie faible, interruption du déplacement");
        return robot;
      }
    }
    return robot;
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
        if (voisin.type === 'X') continue;

        const voisinKey = positionKey(voisin.position);

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
          const fScore = tentativeGScore + this.distance(voisin.position, fin);

          // Vérifier si le voisin est déjà dans openSet
          const existingIndex = openSet.findIndex(node =>
            node.position.x === voisin.position.x && node.position.y === voisin.position.y
          );

          if (existingIndex !== -1) {
            // Mettre à jour les valeurs
            openSet[existingIndex].g = tentativeGScore;
            openSet[existingIndex].f = fScore;
          } else {
            // Ajouter à openSet
            openSet.push({
              position: voisin.position,
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
  public energieNecessairePourRetour(): number {
    // Estimer la distance jusqu'à la base
    const distance = this.distance(this.position, this.basePosition);

    // Ajouter une marge de sécurité
    return (distance * this.consommationParMouvement) * 1.2;
  }

  // Retourner à la base de charge
  public retournerALaBase(robot: RobotAspirator): Observable<RobotAspirator> {
    return new Observable((observer) => {
      this.log("Retour à la base de charge");
      // Trouver le chemin vers la base
      const chemin = this.trouverChemin(this.position, this.basePosition);

      if (chemin.length === 0) {
        this.log("Impossible de trouver un chemin vers la base de charge!");
      }

      // Suivre le chemin
      this.updateSubscription = this.suivreLeChemin(robot, chemin).subscribe({
        next: (pos) => {
          this.log('next suivreLeChemin...');
          // this.log("# robotAtLastPosition.position");
          // this.log(AppComponent.robotAtLastPosition.position.x.toString());
          // this.log(AppComponent.robotAtLastPosition.position.y.toString());
          // this.log(pos.x.toString());
          // this.log(pos.y.toString());
          robot.position = {...pos};   
          observer.next(robot);
        },
        error: (err) => {
          this.log('Erreur suivreLeChemin: ' + err);
        },
        complete: () => {
          this.log('complete suivreLeChemin');
          this.updateSubscription.unsubscribe();
          observer.complete();
        }
      });

      this.log("Arrivé à la base de charge avec une batterie de " + this.batterie.toFixed(1) + "%");
    });
  }

  private suivreLeChemin(robot: RobotAspirator, chemin: Position[]): Observable<Position> {
    return new Observable((observer) => {
      let index = 0;
      const intervalId = setInterval(() => {
        // rafraîchissement de l'affichage du labyrinthe avec le robot à sa nouvelle position
        AppComponent.robotAtLastPosition.position = { ...robot.position };
        // Vérifier si nous avons assez de batterie
        if (this.batterie <= 0) {
          this.log("Batterie épuisée avant d'atteindre la base!");
          // return robot;
        } 
        else if (index < chemin.length) {
          // for (const pos of chemin) {
          observer.next(chemin[index]);
          robot = this.deplacer(robot, chemin[index]);
          this.log("retour à la base");
          this.log("robot : X =" + robot.position.x + "/ Y = " + robot.position.y);
          index++;
          AppComponent.updateMaisonWithRobot();
          // return robot;
        } else {
          observer.complete(); // Termine l'observable après avoir émis tous les nombres
          clearInterval(intervalId); // Nettoie l'intervalle
          // return robot;
        }
      }, 250); // Émet une nouvelle valeur toutes les 250ms

      // Nettoyage si l'abonnement est annulé
      return () => {
        clearInterval(intervalId);
      };
    });
  }

  // Déplacer le robot à une position spécifique
  private deplacer(robot: RobotAspirator, position: Position): RobotAspirator {
    // Mettre à jour la position
    robot.position = { ...position };

    // Marquer la cellule comme visitée
    const cell = AppComponent.maison[position.y][position.x];
    cell.visited = true;
    cell.type = '_';
    // Réduire la batterie
    robot.batterie -= this.consommationParMouvement;

    this.log(`Déplacement vers (${position.x}, ${position.y}). Batterie: ${robot.batterie.toFixed(1)}%`);
    return robot;
  }

  private log(message: string) {
    this.messageService.add(`AppComponent: ${message}`);
  }
}
