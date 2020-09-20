/******** Variables globales ********/

const socket = io();
let fullBoard;
let boardSize = 3;

//se definen los persosnajes y se declaran las imagenes como variables globales
const characters = [
    {
        name: 'Meliodas',
        cellImg: './assets/images/Meliodas-fullbody.png',
        iconImg: './assets/images/meliodas.png'
    },
    {
        name: 'Ban',
        cellImg: './assets/images/ban-fullbody.png',
        iconImg: './assets/images/ban.png'
    },
    {
        name: 'Escanor',
        cellImg: './assets/images/escanor-fullbody.png',
        iconImg: './assets/images/escanor.png'
    }
];

let gameOver = false;

let clientPlayer = {
    id: null,
    isTurn: false,
    room: null,
    gameStarted: false,
    character: null
};

const opponentPlayer = {
    id: null
};

/******** FINAL DE LAS VARIABLES GLOBALES ********/

// FUNCIÓN QUE INICIA EL JUEGO
window.onload = function() {
    gameInitializer()
};

// Agregar controladores de funciones
const gameInitializer = () => {
    addInitialHandlers();
};


// Contiene nuestros controladores de funciones iniciales que deben agregarse antes de que comience el juego
const addInitialHandlers = () => {
    selectPlayerHandler();
    createRoomHandler();
    joinOrCreateClickHandler();
    clearRoomFullMessageHandler();
    leaveGameHandler();
};

// Función que Inicia el juego después de que ambos clientes hayan seleccionado un jugador
const gameStart = () => {
    if(!clientPlayer.gameStarted) {
        document
            .getElementById('gameBoard')
            .innerHTML = '';
        buildGameBoard(boardSize);
        cellClickHandler();
        if (clientPlayer.id === 1) clientPlayer.isTurn = true;
        clientPlayer.gameStarted = true;
        addPlayerIcons();
        Array
            .from(document.getElementsByClassName('playerIndicator'))
            .filter(player => player.getAttribute('player') === '1')[0]
            .style.border = '2px solid yellow';
        Array
            .from(document.getElementsByClassName('playerIndicator'))
            .filter(player => player.getAttribute('player') !== '1')[0]
            .style.border = '2px solid transparent';
    }
};

// Función para manejar la visualización de elementos en el modelo 
const showHideElement = (element, display) => {
    document.getElementById(element).style.display = display
};

// Función que Compila el tablero del jeugo en el modelo
const buildGameBoard = (boardSize) => {
    const boardRows = new Array(boardSize);

    fullBoard = [...boardRows]
        .map(_ => [...boardRows]
            .map(_ => 0));

    fullBoard.forEach((row, rowInd) => {
        row.forEach((cell, cellInd) => {
            document.getElementById('gameBoard')
                .innerHTML += `<div col='${cellInd+1}' row="${rowInd+1}" class="gameCell"></div>`
        })
    })
};

// Función que agrega las imagenes de los jugadores en el tablero de juego
const addPlayerIcons = () => {
    const playerBoxes = Array.from(document.getElementsByClassName('playerIndicator'));
    playerBoxes.forEach(box => {
        switch(box.getAttribute('player')){
            case '1':
                box.style.backgroundImage = `url(${characters[0].iconImg})`;
                box.className += ' playerIndicatorBackground';
                break;
            case '2':
                box.style.backgroundImage = `url(${characters[1].iconImg})`;
                box.className += ' playerIndicatorBackground';
                break;
            default:
                box.style.background = '';
        }
    })
};

// crea la funcionalidad de la pantalla 
const createRoom = () => {
    clientPlayer.room = document.getElementById('roomName').value.trim().toLowerCase();
    socket.emit('createRoom', clientPlayer.room);
};

// aplica el click como listener para crear la sesión del juego
const createRoomHandler = () => {
    document.getElementById('roomBtn').addEventListener('click', createRoom);
};

// función que crea la funcionalidad de ingresar a la sala del juego
const joinRoom = (e) => {
    clientPlayer.room = e.target.innerText;
    socket.emit('joinRoom', clientPlayer.room);
};

// agrega el listener al dar click cuando se ingresa a la sala del juego
const joinRoomHandler = () => {
    Array
        .from(document.getElementById('roomList').children)
        .forEach(li => {
            li.addEventListener('click', joinRoom);
        })
};

// función que permite cambiar pantallas entre ingresar y crear pantallas
const joinOrCreateRoom = (currentScreen, destinationScreen) => {
    showHideElement(currentScreen, 'none');
    showHideElement(destinationScreen, 'flex');
};

// función que crea los links al dar click en los  botones 
const joinOrCreateClickHandler = () => {
    document
        .getElementById('newRoomLink')
        .addEventListener('click', () => {
            joinOrCreateRoom('existingRooms', 'createRoom')
        });
    document
        .getElementById('createRoomLink')
        .addEventListener('click', () => {
            joinOrCreateRoom('createRoom', 'existingRooms')
        });
};

// elimina mensaje de error cuando la sala este llena
const clearRoomFullMessage = () => {
    document.querySelector('.roomFullMessage').innerHTML = '';
    document.querySelector('.roomTakenMessage').innerHTML = '';
};

// configura que cuando se de click que se elimine el mensaje de error
const clearRoomFullMessageHandler = () => {
    document.getElementById('roomSelect').addEventListener('click', clearRoomFullMessage);
};

//Función de asignar el personaje que se desea
const assignCharacterToPlayer = (playerId) => {
    // se agina el persona al jugador
    switch(playerId) {
        case 1:
            clientPlayer.character = characters[0];
            break;
        case 2:
            clientPlayer.character = characters[1];
            break;
        
        default:
            clientPlayer.character = null;
    }
};

// Función que muestra el mensaje que se espera a que otro jugador ingrese a la sala
const waitForPlayer = () => {
    document
        .getElementById('gameBoard')
        .innerHTML = `<div class="wait-for-player">Esperando a oponente...<br><div class="loader">Loading...</div></div>`;
};

// función que crea la funcionalidad del jugador
const selectPlayer = () => {
    // Se crean las variables de los jugadores
    const playerSelected = Array
        .from(document.getElementsByName('player'))
        .filter(player => player.checked)[0];

    // se define el identificador del jugador
    clientPlayer.id = parseInt(playerSelected.value);

    assignCharacterToPlayer(clientPlayer.id);

    // se elimina el personaje que fue elegido 
    showHideElement('gameStartModal','none');

    // se envia la selección del personaje al servidor
    socket.emit('playerSelectionToServer', clientPlayer);

    document.getElementById('gameRoomName').innerText = clientPlayer.room;

    // condición donde el oponente debe de seleccionar un personaje para comenzar el juego
    if(!opponentPlayer.id) {
        waitForPlayer();
    }else{
        gameStart();
    }
};

// se agrega el listener cuando el jugador de click
const selectPlayerHandler = () => {
    document.getElementById('charSelectBtn')
        .addEventListener('click', selectPlayer);
};

// función de dar click a los espacios del tablero
const cellClicked = (e) => {
    // condición donde se permite dar unicamente click si es el turno del jugado
    if(clientPlayer.isTurn) {

        // función que busca el atributo de celda por columna y fila aplicado en la función BuildGameBoard
        const row = e.target.getAttribute('row') - 1;
        const col = e.target.getAttribute('col') - 1;

        // función que establece la celda de acuerdo al jugador
        if(fullBoard[row][col] === 0) {
            fullBoard[row][col] = clientPlayer.id;
            // función que envia al servidor el tablero con las jugadas
            socket.emit('updateBoard', {fullBoard, clientPlayer});

            // función que bloquea al jugador si no es su turno
            clientPlayer.isTurn = false
        }
    }else{
        alert('No es tu turno')
    }
};

// función que agrega la funcionalidad de los click en cada celda
const cellClickHandler = () => {
    Array.from(document.getElementsByClassName('gameCell'))
        .forEach(cell => {
            cell.addEventListener('click', cellClicked);
        })
};

/********* condiciones de ganar *********/

// funciín que chequea el progreso de juego
const catsGame = () => {
    if(!gameOver) {
        fullBoard
            .reduce((acc, val) => acc.concat(val), [])
            .filter(cellValue => cellValue === 0).length === 0 ? showCatsGame() : null;
    }
};

// función que revisa las combinaciones que pueden ganar
const checkRow = (player) => {
    fullBoard
        .map(row => row
            .filter(cell => cell === player.id)
        )
        .forEach(row => {
            if(row.length === boardSize) {
                showWin(player.character);
            }
        });
};

// revisa las combinaciones de ganar en columnas
const checkCol = (player) => {
    fullBoard
        .map((row, ind) => row
            .map((_, i) => {
                return fullBoard[i][ind]
            }).filter(cell => cell === player.id)
        )
        .forEach(col => {
            if(col.length === boardSize) {
                showWin(player.character);
            }
        });
};

// revisa las combinaciones ganadores en diagonal de izquierda a derecha
const checkDiag1 = (player) => {
    if(fullBoard.reduce((acc, val, i) => {
        return acc.concat(val[i]);
    },[]).filter(cell => cell === player.id).length === boardSize){
        showWin(player.character)
    }
};

// revisa las combinaciones ganadores en diagonal de derecha a izquierda
const checkDiag2 = (player) => {
    if(fullBoard.reduce((acc, val, i) => {
        return acc.concat(val[fullBoard.length-(1+i)]);
    },[]).filter(cell => cell === player.id).length === boardSize){
        showWin(player.character)
    }
};

// revisa si el jugador ha ganado
const checkWinCondition = (player) => {
    checkRow(player);
    checkCol(player);
    checkDiag1(player);
    checkDiag2(player);
    catsGame();
};

// aniamación del jugador ganador
const winAnimation = () => {
    document.querySelector('.gameWinner').children[0].style.opacity = '1';
    document.querySelector('.gameWinner').children[2].style.top = '0';
    window.requestAnimationFrame(winAnimation);
};

// función que aplica la animación del jugador ganador
const showWin = (character) => {
    showHideElement('gameOverModal','flex');
    document.getElementById('gameOverModal').innerHTML = `<div class="gameWinner"><p>${character.name}  es el ganador!!!</p><br><img src="${character.cellImg}" height = 600px alt="${character.name}" /> </div>`;
    window.requestAnimationFrame(winAnimation);
    gameOver = true;
    resetGame();
};

const showCatsGame = () => {
    showHideElement('gameOverModal','flex');
    document.getElementById('gameOverModal').innerHTML = `<div class="gameWinner"><p>Cat's Game...</p><br><img src="${characters[2].cellImg}" alt="${characters[2].name}" /> </div>`;
    window.requestAnimationFrame(winAnimation);
    gameOver = true;
    resetGame();
};

// limpiar el tablero del juego y muestra pantalla para seleccionar otro jugador
// elimianr el bloqueo del otro jugador para escoger otro personaje
// Envía el reinicio al jugador contrario para ver si ya ha seleccionado un nuevo jugador.
// si el jugador ya slecciono a un nuevo personaje se desbloque sus funciones
const gameOverModalClick = () => {
    document.getElementById('gameBoard').innerHTML = '';
    showHideElement('gameOverModal','none');
    showHideElement('gameStartModal', 'flex');
    gameOver = false;
    // condición donde el turno del jugador haya iniciado como al principio
    if(clientPlayer.isTurn) clientPlayer.isTurn = false;
    Array
        .from(document.getElementsByName('player'))
        .forEach(player => {
            player.checked = false;
            player
                .getAttribute('disabled') === 'disabled' ? player.removeAttribute('disabled') : null;
        });
    socket.emit('initiateReset', clientPlayer.room);
};

// restablecer a los jugadores a sus funciones 
const resetGame = () => {
    clientPlayer = {
        ...clientPlayer,
        id: null,
        isTurn: false,
        gameStarted: false,
        character: null
    };
    opponentPlayer.id = null;
    document
        .getElementById('gameOverModal')
        .addEventListener('click', gameOverModalClick);
};

// función que permite enviar un tablero nuevo
const rebuildBoard = (lastPlayer) => {
    // función que elimina el tablero anterior
    document.getElementById('gameBoard').innerHTML = '';

    // revisa el tablero actualizado y coloca sus personajes en cada celda
    fullBoard.forEach((row, rowInd) => {
        row.forEach((cell, cellInd) => {
            document.getElementById('gameBoard')
                .innerHTML += `<div 
                    col='${cellInd + 1}' 
                    row="${rowInd + 1}" 
                    style="background: url(${cell === 1 ? characters[0].cellImg : cell === 2 ? characters[1].cellImg : ''}) center/50% no-repeat;" 
                    class="gameCell"></div>`
        })
    });

    // establece de nuevo la funcionalidad de los clicks
    cellClickHandler();

    // revisa si el ultimo movimiento gana el juego
    checkWinCondition(lastPlayer);
};

const leaveGame = () => {
    socket.emit('leavingGame', {room: clientPlayer.room})
};

const leaveGameHandler = () => {
    document.getElementById('leaveRoomLink').addEventListener('click', leaveGame);
};

