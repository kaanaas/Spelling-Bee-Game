// Bee Game Controller

// Import modules
import {letterValues} from "./dictionaries/letterValues.js";
import {sowpods} from "./dictionaries/sowpods.js";

// sounds
const audioGameEnd = new Audio("../sounds/mixkit-revealing-bonus-notification-958.wav");
const audioShuffle = new Audio("../sounds/mixkit-correct-answer-notification-947.wav")
const audioCorrect = new Audio("../sounds/mixkit-correct-answer-tone-2870.wav");
const audioWrong = new Audio("../sounds/mixkit-wrong-electricity-buzz-955.wav");
const audioNewGame = new Audio("../sounds/mixkit-tile-game-reveal-960.wav");

const dict = sowpods;

// Initialize variables
const lengthBonuses = [0, 2, 4, 8, 13];
const bingoBonus = 50;
const noOfLetters = 7;      // value for number of letters to fill in grid
const validLetters = [{"difficulty": ""}, {"keystoneLetter": "", "otherLetters": []}];
const wordsTried = [];      // Submitted word list
const wordsTriedRaw = [];   // Without score attached
const gameWordList = [];    // All playable words this round
const gameWordListScored = [];  // With scores
var gameBingos = 0;
var foundBingos = 0;
var allowInput = false;
const table = document.getElementById("wordlistTable");
const totalTable = document.getElementById("totalScore");
const allWordsTable = document.getElementById("allWordsTable");
const allWordsTableWrapper =  document.getElementById("allWordsTableWrapper");
const wordInput = document.getElementById("wordInput");
const endScreen = document.getElementById("endScreen");
buildTable(wordsTried);     // build table on page load


/* Events */
/* Buttons */
// Generate letters on page load
window.onload = resetGame;
wordInput.focus();

// Reset button pressed: generate new letters
document.getElementById("resetButton").addEventListener("click", resetGame);

// Shuffle button pressed: shuffle board position
document.getElementById("shuffleButton").addEventListener("click", function() {
    playAudioShuffle();
    shuffleArray(validLetters[1].otherLetters);
    updateGameBoard();
});

// Give up button pressed: Show end game screen
document.getElementById("endButton").addEventListener("click", function() {
    audioGameEnd.play();
    wordInput.disabled = true;
    allowInput = false;
    buildTableEnd(gameWordListScored);
    document.getElementById("submitMessage").innerHTML = "Press <b>Reset</b> &#x21BB; to play again!"
    endScreen.style.display = "inline-block";
    document.getElementById("gameOverMessage").innerHTML = `Game Over!`;
    let totalScore = getTotalScore(gameWordListScored);
    let playerScore = getTotalScore(wordsTried);
    document.getElementById("endMessage").innerHTML = `You found <b>${wordsTried.length}/${gameWordList.length}</b> words for a total of <b>${playerScore}/${totalScore}</b> points!`;
    if (!(gameBingos === 0)) {
        document.getElementById("bingoMessage").innerHTML = `You found <b>${foundBingos}/${gameBingos}</b> bingos.`;
    }
    let best = getBestWord(wordsTried);
    if (wordsTried.length > 0) { document.getElementById("bestWord").innerHTML = `Your best word was <b class="accepted-word">${best.word}</b> for <b>${best.score}</b> points!`; }
});

// Close end screen button
document.getElementById("closeEndButton").addEventListener("click", function () {
    endScreen.style.display = "none";
});

// See more words button
document.getElementById("seeMoreButton").addEventListener("change", function () {
    this.checked ? allWordsTableWrapper.style.display = "block" : allWordsTableWrapper.style.display = "none";
});



// validate input field - letters only
const validateInput = function(event) {
    if (event.code.lastIndexOf("Key", 0) !== 0 && (event.code !== "Enter" && event.which !== 13)) {
        event.preventDefault();
    } else if (allowInput === false) {
        event.preventDefault();
    }
}

// Submit word on enter
wordInput.addEventListener("keypress", validateInput);      // prevent entering of non-alphabetical characters
wordInput.addEventListener("keyup", function (event) {
    if (wordInput.value !== "" && (event.which === 13 || event.key === "Enter")) {
        submitWord();
    }
});

// Submit word on submit button
document.getElementById("submitWordButton").addEventListener("click", submitWord);


// Hex responses to input
for (let n = 0; n < noOfLetters; n++) {
    // click to enter letter
    let hex = document.getElementById(`hex${n}`);
    hex.addEventListener("click", function hexClick() {
        if (allowInput === true) {
            let hexLetter = document.getElementById(`hexChar${n}`).innerHTML[0];
            wordInput.focus();
            wordInput.value += hexLetter;
        }
    });

    // type to depress hex
    wordInput.addEventListener("keydown", function depressHex(event) {
        let hexLetter = document.getElementById(`hexChar${n}`).innerHTML[0];
        if (event.key.toUpperCase() === hexLetter) {
            hex.style.transform = "scale(0.9)";
        }
    });
    // restore original size after keypress
    wordInput.addEventListener("keyup", function depressHex(event) {
        let hexLetter = document.getElementById(`hexChar${n}`).innerHTML[0];
        if (event.key.toUpperCase() === hexLetter) {
            hex.style.transform = "scale(1)";
        }
    });
}





// Functions

/**
 *
 * @param word
 * @param keystoneLetter
 * @param otherLetters
 * @returns {string}
 */
/* Check word is valid by game rules.
Rules:
- uses only letters in generated letters list
- uses keystone letter
- 4 letters or greater
- no repetition
 */
function checkWordValid(word) {
    let status;
    let validLettersAll = [...validLetters[1].keystoneLetter, ...validLetters[1].otherLetters];
    for (let i = 0; i < word.length; i++) {
        if (!validLettersAll.includes(word[i])) {
            status = "invalid letter";
            return status;
        }
    }
    if (!word.includes(validLetters[1].keystoneLetter)) {
        status = "no keystone";
    } else if (word.length < 4) {
        status = "too short";
    } else if (wordsTried.some(element => element.word === word)) {
        status = "repeat";
    } else {
        status = "valid";
    }

    return status;
}

/**
 *
 * @param word
 * @returns {*}
 */
// Check word in dictionary
function checkWordInDict(word) {
    let firstLetter = word[0];
    return dict[firstLetter].includes(word);
    // return gameWordList.includes(word);
}

/**
 *
 * @param word
 * @returns {(number|boolean)[]}
 */
// Score word
function scoreWord(word) {
    let validLettersAll = [...validLetters[1].keystoneLetter, ...validLetters[1].otherLetters];
    let difficulty = validLetters[0].difficulty;
    let score = 0;
    // individual letter scores
    for (let i = 0; i < word.length; i++) {
        let letterScore = letterValues[word[i]].points;
        score += letterScore;
    }

    // length bonus scores
    let lengthBonus = 0;
    if (word.length < (4 + lengthBonuses.length)) {
        lengthBonus = lengthBonuses[word.length - 4]
    } else {
        lengthBonus = lengthBonuses[lengthBonuses.length-1]
        for (let len = word.length; len >= (lengthBonuses.length + 4); len--) {
            lengthBonus += len;
        }
    }
    score += lengthBonus;
    // console.log(`length bonus of ${lengthBonus}`);

    // bingo bonus
    let bingo = false;
    for (let i = 0; i < validLettersAll.length; i++) {
        if (!word.includes(validLettersAll[i])) {
            bingo = false;
            break;
        } else {
            bingo = true;
        }
    }
    if (bingo === true) {
        score += bingoBonus;
        // console.log(`Bingo found: ${word}! Bonus of ${bingoBonus} points.`);
    }

    // difficulty multiplier (last)
    if (difficulty === "hard") { score *= 1.5; }
    return [Math.floor(score), bingo];
}

/**
 *
 */
// Submits word on enter/button press
function submitWord() {
    // reset temporary word handler
    let wordInstance = {"word": "", "score": 0, "bingo": false};
    wordInstance.word = wordInput.value.toUpperCase();

    /* Check word */
    // check if in dictionary
    if (checkWordInDict(wordInstance.word)) {
        // check validity by game rules
        let validStatus = checkWordValid(wordInstance.word)
        // console.log(validStatus);
        if (validStatus === "invalid letter") {
            playAudioWrong();
            document.getElementById("submitMessage").innerHTML = `<b class="rejected-word accepted-word-wrapper">${wordInstance.word}</b> contains invalid letters!`;
            wordInput.value = "";   // reset input field
        } else if (validStatus === "no keystone") {
            playAudioWrong();
            document.getElementById("submitMessage").innerHTML = `<b class="rejected-word accepted-word-wrapper">${wordInstance.word}</b> doesn't contain <b>${validLetters[1].keystoneLetter}</b>!`;
            wordInput.value = "";   // reset input field
        } else if (validStatus === "too short") {
            playAudioWrong();
            document.getElementById("submitMessage").innerHTML = `<b class="rejected-word accepted-word-wrapper">${wordInstance.word}</b> is less than 4 letters long!`;
            wordInput.value = "";   // reset input field
        } else if (validStatus === "repeat") {
            playAudioWrong();
            document.getElementById("submitMessage").innerHTML = `<b class="repeated-word accepted-word-wrapper">${wordInstance.word}</b> was already used.`;
            wordInput.value = "";   // reset input field
        } else {
            playAudioCorrect();
            [wordInstance.score, wordInstance.bingo] = scoreWord(wordInstance.word);
            // update words tried list and score
            wordsTried.push(wordInstance);
            wordsTriedRaw.push(wordInstance.word);

            if (wordInstance.bingo === true) { foundBingos++ }
            document.getElementById("submitMessage").innerHTML = `<b class="accepted-word accepted-word-wrapper">${wordInstance.word}</b> for <b>${wordInstance.score}</b> points!`;
            wordInput.value = "";   // reset input field
            buildTable(wordsTried);
        }
    } else {
        playAudioWrong();
        document.getElementById("submitMessage").innerHTML = `<b class="rejected-word accepted-word-wrapper">${wordInstance.word}</b> is not a valid word!`;
        wordInput.value = "";   // reset input field
    }

    // If all possible words found: end game screen
    if (wordsTriedRaw.length === gameWordList.length) {
        if (wordsTriedRaw.sort() === gameWordList.sort()) {
            let best = getBestWord(wordsTried);
            let totalScore = getTotalScore(gameWordListScored);
            endScreen.style.display = "inline-block";
            document.getElementById("gameOverMessage").innerHTML = `Congrats!`;
            document.getElementById("endMessage").innerHTML = `You found all <b>${gameWordList.length}</b> words for ${totalScore} points!`;
            if (!(gameBingos === 0)) {
                document.getElementById("bingoMessage").innerHTML = `You found all <b>${gameBingos}</b> bingos.`;
            }
            document.getElementById("bestWord").innerHTML = `Your best word was <b class="accepted-word">${best.word}</b> for <b>${best.score}</b> points!`;
            scoreAllWords();
            buildTableEnd(gameWordListScored);
        }
    }

    // debug - clear temporary word handler
    wordInstance = {"word": "", "score": 0, "bingo": false};
}

/**
 *
 * @param tried
 */
// Build table
function buildTable(tried) {
    table.innerHTML = ``;
    for (let i = 0; i < tried.length; i++) {
        let row = `<tr>
                        <td class="col-word"><div class="_ellipsis">${tried[i].word}</div></td>
                        <td class="col-score"><div class="_ellipsis">${tried[i].score}</div></td>
                   </tr>`;
        table.innerHTML = row + table.innerHTML;
    }

    // Update total score (consider adding after score-calc step for better implementation?)
    totalTable.innerHTML = ``;
    let totalScore = 0;
    for (let i = 0; i < tried.length; i++) {
        totalScore += tried[i].score;
    }
    totalScore ? totalTable.innerHTML = `${totalScore}` : totalTable.innerHTML = "0";
    document.getElementById("wordsLeft").innerHTML = `<b class="words-left-no">${tried.length}/${gameWordList.length}</b> words found!`
    if (!(gameBingos === 0)) {
        document.getElementById("bingosLeft").innerHTML = `<b class="words-left-no">${foundBingos}/${gameBingos}</b> bingos found!`
    }
}

// generate scores for all game words
function scoreAllWords() {
    gameWordListScored.length = 0;
    for (let i = 0; i < gameWordList.length; i++) {
        let scoreOut = scoreWord(gameWordList[i]);
        let thisWord = {"word": gameWordList[i], "score": scoreOut[0]};
        gameWordListScored.push(thisWord);
        if (scoreOut[1] === true) {
            gameBingos++;
        }
    }
     // console.log(gameWordListScored);
}

// Build end screen table (all words)
function buildTableEnd(wordsAll) {
    allWordsTable.innerHTML = ``;
    for (let i = 0; i < wordsAll.length; i++) {
        if (wordsTriedRaw.includes(wordsAll[i].word)) {
            let row = `<tr>
                        <td class="col-word"><div class="_ellipsis"><b class="accepted-word">${wordsAll[i].word}</b></div></td>
                        <td class="col-score"><div class="_ellipsis"><b>${wordsAll[i].score}</b></div></td>
                   </tr>`;
            allWordsTable.innerHTML += row;
        } else {
            let row = `<tr>
                        <td class="col-word"><div class="_ellipsis">${wordsAll[i].word}</div></td>
                        <td class="col-score"><div class="_ellipsis">${wordsAll[i].score}</div></td>
                   </tr>`;
            allWordsTable.innerHTML += row;
        }
    }
}

/**
 *
 */
// Generate random 7 letters
function genLetters() {
    let difficultyState = document.getElementById("difficultySwitch").checked ? "hard" : "easy";
    let weightedArray = weighLetters(letterValues, difficultyState);
    let usedLetters = [];

    validLetters[1].keystoneLetter = weightedArray[weightedArray.length * Math.random() | 0]
    usedLetters.push(validLetters[1].keystoneLetter);

    validLetters[1].otherLetters.length = 0;
    let iLGen = 0;
    while (iLGen < noOfLetters - 1) {
        let LGen = weightedArray[weightedArray.length * Math.random() | 0];
        if (!usedLetters.includes(LGen)) {
            validLetters[1].otherLetters.push(LGen);
            usedLetters.push(LGen);
            iLGen++;
        }
    }

    console.log(`Key letter: ${validLetters[1].keystoneLetter}, Other letters chosen: ${validLetters[1].otherLetters}`);
    usedLetters.length = 0;

    updateGameBoard();
}

// Generate list of all words playable this round
function genGameWordList() {
    gameWordList.length = 0;
    let letters = Object.keys(letterValues);
    let validLettersAll = [...validLetters[1].keystoneLetter, ...validLetters[1].otherLetters];
    let reg = new RegExp(`^[${validLettersAll}]+$`, "g");

    for (let i = 0; i < letters.length; i++) {
        let letterDict = dict[letters[i]];
        for (let j = 0; j < letterDict.length; j++) {
            if (reg.test(letterDict[j]) && (letterDict[j].length >= 4) && (letterDict[j].includes(validLetters[1].keystoneLetter))) {
                gameWordList.push(letterDict[j]);
            }
        }
    }
    scoreAllWords();
    console.log(`Game word list: ${gameWordList}`);
}

// creates weighted array of letters to choose from
/**
 *
 * @param letterValues
 * @param difficulty
 * @returns {*[]}
 */
function weighLetters(letterValues, difficulty) {
    let wArray = [];
    const letters = Object.keys(letterValues);
    for (let i = 0; i < letters.length; i++) {
        let letterWeight = letterValues[letters[i]][`weight-${difficulty}`];
        for (let j = 0; j < letterWeight; j++) {
            wArray.push(letters[i]);
        }
    }
    console.log(`Difficulty: ${difficulty}`);
    return wArray;
}

// gets best word
function getBestWord(tried) {
    let bestScore = 0; let bestWord = "";
    for (let i = 0; i < tried.length; i++) {
        if (tried[i].score > bestScore) {
            bestScore = tried[i].score;
            bestWord = tried[i].word;
        }
    }
    return {"word": bestWord, "score": bestScore};
}

// Gets total score
function getTotalScore(wordlist) {
    let total = 0;
    wordlist.forEach(item => {
        total += item.score;
    });
    return total;
}



/**
 *
 * @param array
 */
// shuffles letter array
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

/**
 *
 */
// Update game board
function updateGameBoard() {
    document.getElementById("hexChar0").innerHTML = validLetters[1].keystoneLetter;
    for (let i = 0; i < noOfLetters - 1; i++) {
        document.getElementById(`hexChar${i+1}`).innerHTML = validLetters[1].otherLetters[i];
    }
}

// Plays audio cue (correct)
function playAudioCorrect() {
    audioCorrect.currentTime = 0;
    audioCorrect.play();
}

// Plays audio cue (wrong)
function playAudioWrong() {
    audioWrong.currentTime = 0;
    audioWrong.play();
}

// Plays audio cue (shuffle)
function playAudioShuffle() {
    audioShuffle.currentTime = 0;
    audioShuffle.play();
}


/**
 *
 */
// Resets the game
function resetGame() {
    audioNewGame.currentTime = 0;
    audioNewGame.play();

    wordsTried.length = 0;
    gameBingos = 0;
    foundBingos = 0;
    wordInput.value = "";
    wordInput.disabled = false;
    allowInput = true;

    genLetters();
    genGameWordList();
    allWordsTable.innerHTML = ``;
    allWordsTableWrapper.style.display = "none";

    endScreen.style.display = "none";
    document.getElementById("submitMessage").innerHTML = "Press enter to submit!"
    buildTable(wordsTried);
    wordInput.focus();
    document.getElementById("seeMoreButton").checked = false;
}