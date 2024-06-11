const homeContainer = document.querySelector(".home_container");
const createRoomButton = document.getElementById("create_room");
const joinRoomButton = document.getElementById("join_room");
const error = document.getElementById("error");

const welcomeSection = document.querySelector(".welcome_section");
const nextButton = document.getElementById("next_button");

const waitingSection = document.querySelector(".waiting_section");
const joinedPlayers = document.getElementById("joined_players");
const startGameButton = document.getElementById("start_game");
const spinner = document.querySelector(".spinner");

const gameSection = document.querySelector(".game_section");
const playersInRoom = document.getElementById("players_in_room");
const playerTurn = document.getElementById("player_turn");

const winnerSection = document.querySelector(".winner_section");
const gameWinner = document.getElementById("game_winner");

let usersInStation = [];

Edrys.onReady(() => {
  console.log("Module Multiplayer is loaded!");
});


// Number of players who have joined the room
let playersJoinedNumber = 0;

// Number of players chosen by the user
let playersNumber = 0;


const changeTab = (showContainers, hideContainers, displayStyle) => {
  hideContainers.forEach(container => container.style.display = 'none');
  showContainers.forEach(container => container.style.display = displayStyle);
};

// Display welcome section after creating a room
createRoomButton.onclick = () => {
  if (usersInStation.length > 1) {
    error.innerHTML = "Room is busy! Try to join.";
    return;
  }

  playersNumber = +document.getElementById("players_number").value;

  changeTab([welcomeSection], [homeContainer], 'flex');
};

// If user was invited to a room
joinRoomButton.onclick = () => {
  playersNumber = +document.getElementById("players_number").value;

  updatePlayersInRoom();

  if (playersJoinedNumber > 1) {
    changeTab([waitingSection], [homeContainer, welcomeSection], 'flex');
  } else {
    error.innerHTML = "Please create a room first!";
  }
};

// Display waiting section after clicking next button
nextButton.onclick = () => {
  changeTab([waitingSection], [welcomeSection], 'flex');

  updatePlayersInRoom();
};

let sortedPlayers = [];
// Start game after clicking start game button
startGameButton.onclick = () => {
  sortedPlayers = [...usersInStation].sort();
  
  for (const player of usersInStation) {
    playersInRoom.innerHTML +=
        player === usersInStation[0]
          ? `<div class='main_user'>${player} (Me)</div>`
          : `<div class='user_raw'>${player}</div>`;
  }

  changeTab([gameSection], [waitingSection], 'block');

  startGame();
};


// Update players in room after new users join
const updatePlayersInRoom = () => {
  joinedPlayers.innerHTML = "";

  const allUsers = Edrys.liveClass.users;
  for (const idx in allUsers) {
    const user = allUsers[idx];

    if (user.room.includes("Station") && !user.displayName.includes("Station") && !usersInStation.includes(user.displayName)) {
      usersInStation.push(user.displayName);
    }
  }

  playersJoinedNumber = usersInStation.length;

  if (playersJoinedNumber >= 0) {
    for (const user of usersInStation) {
      joinedPlayers.innerHTML +=
        user === Edrys.liveUser.displayName
          ? `<div class='main_user'>${user} (Me)</div>`
          : `<div class='user_raw'>${user}</div>`;
    }
  } else {
    joinedPlayers.innerHTML = "<div>No players in room</div>";
  }

  // Enable start game button if all players have joined
  if (playersNumber === playersJoinedNumber) {
    startGameButton.disabled = false;
    spinner.style.display = "none";
  }
};


Edrys.onUpdate(() => {
  updatePlayersInRoom();
});

const countdownElement = document.querySelector(".countdown");
let currentPlayerIndex = -1; 
let turnDuration;
let challengeSolved = false;


const startGame = () => {
  turnDuration = .5;
  setPlayerTurn("Get Ready!!");
}

const setPlayerTurn = (player) => {
  Edrys.sendMessage("player-turn", player);

  playerTurn.innerHTML = `${player}`;

  // To avoid confusion with the countdown timer (next player get ready)
  setTimeout(() => {
    updateTimer();
  }, 1000);
}

const nextTurn = () => {
  if (challengeSolved) {
    return;
  }

  turnDuration = Edrys.module.config.timer ? Edrys.module.config.timer : 5;
  // Update current player index
  currentPlayerIndex = (currentPlayerIndex + 1) % usersInStation.length;

  setPlayerTurn(sortedPlayers[currentPlayerIndex]);
}


const updateTimer = () => {
  const timestamp = Date.now() / 1000;
  const timeLeft = ((turnDuration * 60) - 1) - Math.round(timestamp) % (turnDuration * 60);
  const minutes = Math.floor(timeLeft / 60);
  let seconds = timeLeft % 60;

  seconds = seconds < 10 ? "0" + seconds : seconds;

  countdownElement.textContent = `${minutes}:${seconds}`;

  const timeLeftPercentage = (timeLeft / (turnDuration * 60)) * 100;

  if (timeLeftPercentage <= 20) {
    countdownElement.style.backgroundColor = "#ea3943";
  } else {
    countdownElement.style.backgroundColor = "#000000";
  }

  if (timeLeft === 0) {
    nextTurn();
  } else {
    setTimeout(updateTimer,  1000);
  }
}


// Handle received messages from other modules
Edrys.onMessage(({ from, subject, body, module }) => {
  if (subject === "challenge-solved" && Edrys.role !== "station") {
    challengeSolved = true;
    changeTab([winnerSection], [gameSection], 'block');
    gameWinner.innerHTML = `${sortedPlayers[currentPlayerIndex]}`;
  }
}, (promiscuous = true));