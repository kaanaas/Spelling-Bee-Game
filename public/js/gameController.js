// Bee Game Controller

// Import modules
import {letterValues} from "./dictionaries/letterValues.js";
import {sowpods} from "./dictionaries/sowpods.js";

// Initialize variables
const lengthBonuses = [0, 2, 4, 8, 13];
const bingoBonus = 50;
const noOfLetters = 7;      // value for number of letters to fill in grid
const validLetters = [{"difficulty": ""}, {"keystoneLetter": "", "otherLetters": []}];
const wordsTried = [];      // Submitted word list
const gameWordList = [];    // All valid words this round (no length restriction)
const gameWordList4 = [];   // All playable words this round
const table = document.getElementById("wordlistTable");
const totalTable = document.getElementById("totalScore");
const wordInput = document.getElementById("wordInput");
buildTable(wordsTried);     // build table on page load


/* Events */
// Generate letters on page load
window.onload = () => {
    genLetters();
    genGameWordList();
}
wordInput.focus();

// Reset button pressed: generate new letters
document.getElementById("resetButton").addEventListener("click", () => {
    genLetters();
    genGameWordList();
    resetGame();
});

// validate input field - letters only
const validateInput = function(event) {
    if (event.code.lastIndexOf("Key", 0) !== 0 && (event.code !== "Enter" && event.which !== 13)) {
        event.preventDefault();
    }
}

// Submit word on enter
wordInput.addEventListener("keypress", validateInput);      // prevent entering of non-alphabetical characters
wordInput.addEventListener("keyup", function (event) {
    if (wordInput.value !== "" && (event.which === 13 || event.key === "Enter")) {
        // reset temporary word handler
        let wordInstance = {"word": "", "score": 0};
        wordInstance.word = wordInput.value.toUpperCase();

        /* Check word */
        // check if in dictionary
        if (checkWordInDict(wordInstance.word)) {
            // check validity by game rules
            let validStatus = checkWordValid(wordInstance.word)
            console.log(validStatus);
            if (validStatus === "invalid letter") {
                document.getElementById("submitMessage").innerHTML = `<b class="rejected-word accepted-word-wrapper">${wordInstance.word}</b> contains invalid letters!`;
                wordInput.value = "";   // reset input field
            } else if (validStatus === "no keystone") {
                document.getElementById("submitMessage").innerHTML = `<b class="rejected-word accepted-word-wrapper">${wordInstance.word}</b> doesn't contain <b>${validLetters[1].keystoneLetter}</b>!`;
                wordInput.value = "";   // reset input field
            } else if (validStatus === "too short") {
                document.getElementById("submitMessage").innerHTML = `<b class="rejected-word accepted-word-wrapper">${wordInstance.word}</b> is less than 4 letters long!`;
                wordInput.value = "";   // reset input field
            } else if (validStatus === "repeat") {
                document.getElementById("submitMessage").innerHTML = `<b class="repeated-word accepted-word-wrapper">${wordInstance.word}</b> was already used.`;
                wordInput.value = "";   // reset input field
            } else {
                wordInstance.score = scoreWord(wordInstance.word);
                // update words tried list and score
                wordsTried.push(wordInstance);
                document.getElementById("submitMessage").innerHTML = `<b class="accepted-word accepted-word-wrapper">${wordInstance.word}</b> for <b>${wordInstance.score}</b> points!`;
                wordInput.value = "";   // reset input field
                buildTable(wordsTried);
            }
        } else {
            document.getElementById("submitMessage").innerHTML = `<b class="rejected-word accepted-word-wrapper">${wordInstance.word}</b> is not a valid word!`;
            wordInput.value = "";   // reset input field
        }

        // debug - clear temporary word handler
        wordInstance = {"word": "", "score": 0};
    }
});


// Hex responses to input
for (let n = 0; n < noOfLetters; n++) {
    // click to enter letter
    let hex = document.getElementById(`hex${n}`);
    hex.addEventListener("click", function hexClick() {
        let hexLetter = document.getElementById(`hexChar${n}`).innerHTML[0];
        wordInput.focus();
        wordInput.value += hexLetter;
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
    // let firstLetter = word[0];
    // return sowpods[firstLetter].includes(word);
    return gameWordList.includes(word);
}

/**
 *
 * @param word
 * @returns {number}
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
    console.log(`length bonus of ${lengthBonus}!`);

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
        console.log(`Bingo! Bonus of ${bingoBonus}!`);
    }

    // difficulty multiplier (last)
    if (difficulty === "hard") { score *= 1.5; }

    return Math.floor(score);
}

/**
 *
 * @param wordsTried
 */
// Build table
function buildTable(wordsTried) {
    table.innerHTML = ``;
    for (let i = 0; i < wordsTried.length; i++) {
        let row = `<tr>
                        <td class="col-word"><div class="_ellipsis">${wordsTried[i].word}</div></td>
                        <td class="col-score"><div class="_ellipsis">${wordsTried[i].score}</div></td>
                   </tr>`;
        table.innerHTML += row;
    }

    // Update total score (consider adding after score-calc step for better implementation?)
    totalTable.innerHTML = ``;
    let totalScore = 0;
    for (let i = 0; i < wordsTried.length; i++) {
        totalScore += wordsTried[i].score;
    }
    totalScore ? totalTable.innerHTML = `${totalScore}` : totalTable.innerHTML = "0";
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

    // Update game board
    document.getElementById("hexChar0").innerHTML = validLetters[1].keystoneLetter;
    for (let i = 0; i < noOfLetters - 1; i++) {
        document.getElementById(`hexChar${i+1}`).innerHTML = validLetters[1].otherLetters[i];
    }
}

// Generate list of all words playable this round
function genGameWordList() {
    let letters = Object.keys(letterValues);
    let validLettersAll = [...validLetters[1].keystoneLetter, ...validLetters[1].otherLetters];
    let reg = new RegExp(`^[${validLettersAll}]+$`, "g");
    for (let i = 0; i < letters.length; i++) {
        let letterDict = sowpods[letters[i]];
        for (let j = 0; j < letterDict.length; j++) {
            if (reg.test(letterDict[j])) { gameWordList.push(letterDict[j]); }
        }
        letterDict.length = 0;
    }

    for (let i = 0; i < gameWordList.length; i++) {
        if ((gameWordList[i].length >= 4) && (gameWordList[i].includes(validLetters[1].keystoneLetter))) { gameWordList4.push(gameWordList[i]); }
    }
    console.log(`Game word list: ${gameWordList4}`);
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

/**
 *
 */
// Resets the game
function resetGame() {
    wordsTried.length = 0;
    wordInput.value = "";
    document.getElementById("submitMessage").innerHTML = "Press enter to submit!"
    buildTable(wordsTried);
}