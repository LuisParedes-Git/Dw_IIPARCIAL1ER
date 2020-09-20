/************ controlodadores de eventos del servidor *************/


//  seleccionar un jugador contrario, recibimos un objeto que contiene ese ID de jugador

socket.on('opponentHasSelected', (data) => {

    // Establece una variable igual al botón de opción que contiene la selección de personajes de los jugadores opuestos

    const playerToDisable = Array
        .from(document.getElementsByName('player'))
        .filter(player => parseInt(player.value) === data.player.id)[0];

    // Desactiva y si está marcado en el lado de nuestros jugadores, desmarque
    playerToDisable.setAttribute('disabled', 'disabled');
    playerToDisable.checked = false;

    // establece los objetos que contiene las variables del jugador al servidor del jugador opuesto
    opponentPlayer.id = data.player.id;

    // condicion que establece que se inicia el juego cuando los 2 jugadores han seleccionado su personaj
    if(clientPlayer.id !== null) {
        gameStart();
    }
});

// función que permite que el tablero se actualice por cada movimiento que realizan los jugadores
socket.on('sendUpdate', board => {
    // establece el arreglo del tablero al tablero que esta en el servidor 
    fullBoard = board.fullBoard;

    // Actualiza el tablero de los jugadores y agrega un borde para indicar el turno del jugador
    rebuildBoard(board.player);
    Array
        .from(document.getElementsByClassName('playerIndicator'))
        .forEach(icon => {
            if(parseInt(icon.getAttribute('player')) === board.player.id){
                icon.style.border = '2px solid transparent';
            }else{
                icon.style.border = '5px solid blue';
            }
        });
});

// El evento de cambio de jugador solo se emite al jugador que NO activó el evento de actualización del tablero al servidor

socket.on('changePlayer', _ => {
    // se establece el turno del jugador cliente
    clientPlayer.isTurn = true;
});

socket.on('getOpponent', () => {
    if(clientPlayer.id !== null) {
        socket.emit('playerSelectionToServer', clientPlayer);
    }
});

socket.on('roomJoined', () => {
    showHideElement('roomSelect', 'none');
    showHideElement('charSelect', 'flex')
});

//mensaje si la partida esta llena

socket.on('roomIsFull', () => {
    document
        .querySelector('.roomFullMessage')
        .innerHTML = '<span class="error-message"> Oh No! Este juego esta lleno, crea otra partida por favor.</span>';
});

//mensaje si la partida ya existe

socket.on('roomAlreadyExists', () => {
    document
        .querySelector('.roomTakenMessage')
        .innerHTML = `<span class="error-message">Oh No! Este juego ya ha sido seleccionado, intenta con otra.</span>`;
});

socket.on('updateRooms', rooms => {
    if(rooms.length === 0){
        showHideElement('existingRooms', 'none');
        showHideElement('createRoom', 'flex');
    }
    document.getElementById('roomList').innerHTML = '';
    rooms.forEach(room => {
        document.getElementById('roomList').innerHTML += `<li class="link"><i class="fas fa-chevron-right"></i>${room}</li>`
    });
    joinRoomHandler();
});

socket.on('leftGame', () => {
    showHideElement('charSelect', 'none');
    showHideElement('roomSelect', 'flex');
});

socket.on('playerDisconnect', () => {
    Array
        .from(document.getElementsByName('player'))
        .forEach(player => {
            player.removeAttribute('disabled');
        });
    opponentPlayer.id = null;
});
