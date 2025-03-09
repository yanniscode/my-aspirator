import { MessageService } from "../services/message.service";

import { Cell } from "./cell";
import { Position } from "./position";

type Direction = 'nord' | 'est' | 'sud' | 'ouest';

export class RobotAspirator {
    
    // Carte de l'environnement
    private grille: Cell[][];
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

    constructor(messageService: MessageService, grille: Cell[][], basePosition: Position);
    // constructor(grille: Cell[][], basePosition?: Position);

    constructor(private messageService: MessageService, grille: Cell[][], basePosition: Position) {
        this.messageService = messageService;

        this.grille = grille;
        this.basePosition = basePosition;
        this.position = { ...basePosition };
        this.direction = 'nord';
        this.batterie = 10;
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

            // Vérifier si la nouvelle position est dans les limites de la grille
            if (
                newX >= 0 && newX < this.grille[0].length &&
                newY >= 0 && newY < this.grille.length
            ) {
                cellules.push(this.grille[newY][newX]);
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
            this.log("robot : X ="+robot.position.x+"/ Y = "+robot.position.y);

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
        // Implémentation simplifiée de l'algorithme A*
        const openSet: {
            position: Position;
            gScore: number;
            fScore: number;
            parent: Position | null;
        }[] = [];

        const closedSet: Set<string> = new Set();
        const gScores: Map<string, number> = new Map();
        const parents: Map<string, Position | null> = new Map();

        const debutKey = `${debut.x},${debut.y}`;
        gScores.set(debutKey, 0);

        openSet.push({
            position: debut,
            gScore: 0,
            fScore: this.distance(debut, fin),
            parent: null
        });

        // ajout de la position de fin du chemin actuelle:
        openSet.push({
            position: fin,
            gScore: 0,
            fScore: this.distance(debut, fin),
            parent: null
        });

        while (openSet.length > 0) {
            // Trouver le nœud avec le plus petit fScore
            openSet.sort((a, b) => a.fScore - b.fScore);
            const current = openSet.shift()!;
            const currentKey = `${current.position.x},${current.position.y}`;

            // Si nous avons atteint la destination
            if (current.position.x === fin.x && current.position.y === fin.y) {
                return this.reconstruireChemin(parents, current.position);
            }

            closedSet.add(currentKey);

            // Vérifier les voisins
            this.obtenirCellulesAdjacentes(current.position).forEach(cellule => {
                // Ignorer les obstacles
                if (cellule.type === 'X') return;
                if (cellule.type === 'B') return;

                const voisinKey = `${cellule.position.x},${cellule.position.y}`;

                // Ignorer les nœuds déjà évalués
                if (closedSet.has(voisinKey)) return;

                const gScore = (gScores.get(currentKey) || Infinity) + 1;

                // Vérifier si le chemin est meilleur
                const existingGScore = gScores.get(voisinKey) || Infinity;
                if (gScore >= existingGScore) return;

                // Mettre à jour les scores
                parents.set(voisinKey, current.position);
                gScores.set(voisinKey, gScore);

                // Vérifier si le voisin est déjà dans openSet
                const existingIndex = openSet.findIndex(
                    node => node.position.x === cellule.position.x && node.position.y === cellule.position.y
                );

                if (existingIndex !== -1) {
                    openSet[existingIndex].gScore = gScore;
                    openSet[existingIndex].fScore = gScore + this.distance(cellule.position, fin);
                    openSet[existingIndex].parent = current.position;
                } else {
                    openSet.push({
                        position: cellule.position,
                        gScore: gScore,
                        fScore: gScore + this.distance(cellule.position, fin),
                        parent: current.position
                    });
                }
            });
        }

        return []; // Aucun chemin trouvé
    }

    // Reconstruire le chemin à partir des parents
    private reconstruireChemin(parents: Map<string, Position | null>, current: Position | null): Position[] {
        const chemin: Position[] = [];
        let currentPos = current;

        while (currentPos) {
            chemin.unshift(currentPos);
            const key = `${currentPos.x},${currentPos.y}`;
            currentPos = parents.get(key) || null;

            // Éviter les boucles infinies (ne devrait pas arriver avec A* correctement implémenté)
            if (chemin.length > 100) break;
        }

        // sauf s'il n'y a qu'une position trouvée pour le chemin:
        if(chemin.length > 1) {
            // Enlever la première position (position actuelle)
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
    public retournerALaBase(robot: RobotAspirator): RobotAspirator {
        this.log("Retour à la base de charge");

        // Trouver le chemin vers la base
        const chemin = this.trouverChemin(this.position, this.basePosition);

        if (chemin.length === 0) {
            this.log("Impossible de trouver un chemin vers la base de charge!");
            return robot
        }

        // Suivre le chemin
        for (const pos of chemin) {
            robot = this.deplacer(robot, pos);

            this.log("retour à la base");
            this.log("robot : X ="+robot.position.x+"/ Y = "+robot.position.y);

            // Vérifier si nous avons assez de batterie
            if (this.batterie <= 0) {
                this.log("Batterie épuisée avant d'atteindre la base!");
                return robot;
            }
        }

        this.log("Arrivé à la base de charge avec une batterie de " + this.batterie.toFixed(1) + "%");
        return robot;
    }

    // Déplacer le robot à une position spécifique
    private deplacer(robot: RobotAspirator, position: Position): RobotAspirator {
        // Mettre à jour la position
        robot.position = { ...position };

        // Marquer la cellule comme visitée
        const cell = this.grille[position.y][position.x];
        cell.visited = true;
        cell.type = 'O';
        // Réduire la batterie
        robot.batterie -= this.consommationParMouvement;

        this.log(`Déplacement vers (${position.x}, ${position.y}). Batterie: ${robot.batterie.toFixed(1)}%`);
        return robot;
    }

    private log(message: string) {
        this.messageService.add(`AppComponent: ${message}`);
    }
}