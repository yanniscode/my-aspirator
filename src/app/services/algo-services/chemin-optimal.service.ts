import { inject, Injectable } from '@angular/core';
import { CellElement } from '../../classes/models/cellElement';
import { GridPosition } from '../../classes/models/grid-position';
import { LoggerService } from '../logger-service/logger.service';

@Injectable({
  providedIn: 'root'
})
export class CheminOptimalService {

  protected loggerService: LoggerService = inject(LoggerService);

  constructor() { }

  // méthode utilisée par RobotAspiratorWithNextPositionsTabService
  public calculerCheminSuivant(isRetourAlaBase: boolean, maison: CellElement[][], basePosition: GridPosition, position: GridPosition): GridPosition[] {
    console.log("CheminOptimalService - calculerCheminSuivant()");

    const prochaineCellule = this.trouverProchaineDestination(maison, position);
    // console.log(prochaineCellule);

    // isRetourAlaBase n'est vrai ici que si prochaineCellule est null ou undefined
    if (prochaineCellule || isRetourAlaBase) {

      let finChemin: GridPosition = !isRetourAlaBase ? { ...prochaineCellule!.position } : { ...basePosition };

      const chemin: GridPosition[] = this.trouverChemin(maison, position, finChemin);
      // console.log(chemin);

      return chemin.map(pos => ({ ...pos }));
      // console.log("Nouveau chemin calculé vers:", prochaineCellule.cellStack[0].position);
    } else {
      console.log("RobotAspiratorService - Aucune cellule accessible non visitée trouvée");
      return [];
    }
  }

  // Trouver la prochaine cellule accessible non visitée la plus proche
  public trouverProchaineDestination(maison: CellElement[][], position: GridPosition): CellElement | null {
    // console.log("CheminOptimalService - trouverProchaineDestination()");

    // Utiliser un algorithme de recherche en largeur (BFS) pour trouver la cellule non visitée la plus proche
    // Cellules adjacentes:
    const queue: { cellElement: CellElement; distance: number }[] = [];
    // Positions visitées:
    const visited: Set<string> = new Set();

    // Ajout de la position actuelle aux positions visitées:
    const positionKey: string = `${position.col},${position.row}`;
    visited.add(positionKey);

    // Recherche des cases adjacentes à la position actuelle
    // On ne les ajoute à la queue que si elles ne sont pas réservées par un autre robot
    this.obtenirCellulesAdjacentes(maison, position).forEach(cellElement => {
      queue.push({ cellElement: cellElement, distance: 1 });
      visited.add(`${cellElement.position.col},${cellElement.position.row}`);
    });

    // On ajoute la position adjacente à la queue
    // On refait l'opération jusqu'à ce qu'on aie trouvé une case non-visitée
    while (queue.length > 0) {
      const { cellElement: cellElement, distance } = queue.shift()!;

      // Si la cellule n'est pas encore visitée et n'est pas un obstacle, la retourner
      if (!cellElement.visited && cellElement.type !== 'X' && cellElement.type !== 'B') {
        return cellElement;
      }

      // TODO: REVOIR LE CHIFFRE SI NÉCESSAIRE
      // Si la distance est trop grande, ne pas continuer la recherche
      if (distance > 20) { // Une limite arbitraire pour éviter une boucle infinie
        continue;
      }

      // Ajouter les cellules adjacentes à la file d'attente
      this.obtenirCellulesAdjacentes(maison, cellElement.position).forEach(adjacentCell => {
        const key = `${adjacentCell.position.col},${adjacentCell.position.row}`;
        if (!visited.has(key)) {
          queue.push({ cellElement: adjacentCell, distance: distance + 1 });
          visited.add(key);
        }
      });
    }
    return null; // Aucune cellule non visitée accessible trouvée
  }

  // pour la version 1 de l'algo - RobotAspiratorWithNextPositionService :
  public trouverPositionSuivante(maison: CellElement[][], depart: GridPosition, fin: GridPosition): GridPosition {
    // console.log("CheminOptimalService - trouverPositionSuivante()");

    return this.trouverChemin(maison, depart, fin)[0];
  }

  // Calculer la distance entre deux positions (heuristique pour A*)
  public distance(a: GridPosition, b: GridPosition): number {
    // console.log("CheminOptimalService - distance()");

    return Math.abs(a.col - b.col) + Math.abs(a.row - b.row); // Distance de Manhattan
  }

  // Algorithme A* pour trouver le chemin optimal
  public trouverChemin(maison: CellElement[][], depart: GridPosition, fin: GridPosition): GridPosition[] {
    // console.log("CheminOptimalService - trouverChemin()");

    // Structure pour représenter un nœud dans l'algorithme A*
    interface Node {
      position: GridPosition;
      g: number; // Coût depuis le départ
      f: number; // Coût estimé total (g + h)
    }

    // Fonction pour créer une clé unique pour une position
    const positionKey = (pos: GridPosition): string => `${pos.col},${pos.row}`;

    // Ensemble des nœuds à explorer (la file de priorité)
    const openSet: Node[] = [];

    // Ensemble des nœuds déjà explorés
    const closedSet = new Set<string>();

    // Map qui associe chaque position à son parent dans le chemin optimal
    const cameFrom = new Map<string, GridPosition>();

    // Map qui stocke le coût g pour chaque position
    const gScore = new Map<string, number>();

    // Initialiser gScore avec des valeurs infinies
    for (let y = 0; y < maison.length; y++) {
      for (let x = 0; x < maison[0].length; x++) {
        gScore.set(`${x},${y}`, Infinity);
      }
    }

    // Coût du départ au départ est 0
    gScore.set(positionKey(depart), 0);

    // Ajouter le nœud de départ à openSet
    openSet.push({
      position: depart,
      g: 0,
      f: this.distance(depart, fin)
    });

    // Tant qu'il y a des nœuds à explorer
    while (openSet.length > 0) {
      // Trier openSet pour obtenir le nœud avec le plus petit f
      openSet.sort((a, b) => a.f - b.f);

      // Récupérer le nœud avec le plus petit f
      const current: Node = openSet.shift()!;
      const currentKey = positionKey(current.position);

      // Si nous sommes arrivés à destination
      if (current.position.col === fin.col && current.position.row === fin.row) {
        // Reconstruire le chemin
        return this.reconstruireChemin(depart, cameFrom, current.position);
      }

      // Marquer le nœud comme exploré
      closedSet.add(currentKey);

      // Explorer les voisins
      const voisins = this.obtenirCellulesAdjacentes(maison, current.position);

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
            node.position.col === voisin.position.col && node.position.row === voisin.position.row
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
      if (openSet.length > maison.length * maison[0].length) {
        console.error("Détection de boucle potentielle dans A*");
        break;
      }
    }
    // Aucun chemin trouvé
    console.log("Aucun chemin trouvé de", depart, "à", fin);
    return [];
  }

  // Méthode pour reconstruire le chemin
  protected reconstruireChemin(position: GridPosition, cameFrom: Map<string, GridPosition>, current: GridPosition): GridPosition[] {
    // console.log("CheminOptimalService - reconstruireChemin()");

    const chemin: GridPosition[] = [];
    let currentPos = current;
    const positionKey = (pos: GridPosition): string => `${pos.col},${pos.row}`;

    // Reconstruire le chemin en partant de la fin
    while (cameFrom.has(positionKey(currentPos))) {
      chemin.unshift(currentPos);
      currentPos = cameFrom.get(positionKey(currentPos))!;
    }

    // Enlever le premier nœud si c'est la position actuelle
    if (chemin.length > 0 &&
      chemin[0].col === position.col &&
      chemin[0].row === position.row) {
      chemin.shift();
    }
    return chemin;
  }

  // Obtenir les cellules adjacentes à une position
  protected obtenirCellulesAdjacentes(maison: CellElement[][], position: GridPosition): CellElement[] {
    // console.log("CheminOptimalService - obtenirCellulesAdjacentes()");

    let direction: { dx: number, dy: number } = { dx: 0, dy: 0 };
    let directions: Map<number, typeof direction> = new Map();
    directions.set(0, { dx: 0, dy: -1 }); // Nord
    directions.set(1, { dx: 1, dy: 0 }); // Est
    directions.set(2, { dx: 0, dy: 1 }); // Sud
    directions.set(3, { dx: -1, dy: 0 }); // Ouest

    const cellules: CellElement[] = [];

    directions.forEach(dir => {
      const newX = position.col + dir.dx;
      const newY = position.row + dir.dy;

      // Vérifier si la nouvelle position est dans les limites de la maison et si c'est un bloc de type Mur
      if (newX >= 0 && newX < maison[0].length &&
        newY >= 0 && newY < maison.length &&
        "X" != maison[newY][newX].type
      ) {
        cellules.push(maison[newY][newX]);
      }
    });
    return cellules;
  }

  /**
* Recherche de la distance du robot à sa base
*
* @param maison
* @param basePosition
* @param position
* @returns
*/
  public distanceDeLaBase(maison: CellElement[][], basePosition: GridPosition, position: GridPosition): number {
    console.log("RobotAspiratorDataService - distanceDeLaBase()");

    const chemin: GridPosition[] = this.trouverChemin(maison, position, basePosition);
    console.log(chemin.length);

    return chemin.length;
  }

  protected log(message: string) {
    this.loggerService.add(`CheminOptimalService: ${message}`);
  }
}
