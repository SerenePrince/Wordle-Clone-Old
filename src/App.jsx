import { useEffect, useState, useRef, useCallback } from "react";
import Header from "./Header";
import Footer from "./Footer";

const App = () => {
  const [message, setMessageState] = useState("");
  const [currentRow, setCurrentRow] = useState(0);
  const [lastFocusedBox, setLastFocusedBox] = useState(null);
  const [validWords, setValidWords] = useState([]);
  const [secretWord, setSecretWord] = useState("");
  const [alphabetStatus, setAlphabetStatus] = useState({});
  const firstBoxRef = useRef([]);

  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  useEffect(() => {
    const loadWordList = async () => {
      try {
        const response = await fetch("./src/assets/word_list.txt");
        const text = await response.text();
        const words = text.split("\n").map((word) => word.trim().toUpperCase());
        setValidWords(words);

        // Randomly set the secret word once
        const randomWord = words[Math.floor(Math.random() * words.length)];
        setSecretWord(randomWord);
      } catch (error) {
        console.error("Error loading word list:", error);
      }
    };

    loadWordList();
  }, []); // Runs once when the component mounts

  // Log the secret word once it's set
  useEffect(() => {
    if (secretWord) {
      console.log("Secret word:", secretWord);
    }
  }); // Logs the secret word only when it's updated

  // Memoized function to update row access
  const updateRowAccess = useCallback(() => {
    const allBoxes = document.querySelectorAll(".grid-box");
    allBoxes.forEach((box) => {
      const row = parseInt(box.getAttribute("data-row"), 10);
      box.disabled = row !== currentRow;
    });

    if (firstBoxRef.current[currentRow]) {
      firstBoxRef.current[currentRow].focus();
    }
  }, [currentRow]);

  // Update row access whenever `currentRow` changes
  useEffect(() => {
    updateRowAccess();
  }, [updateRowAccess]);

  const handleFocus = (e) => setLastFocusedBox(e.target);

  const handleAlphabetClick = (letter) => {
    if (lastFocusedBox && lastFocusedBox.value === "") {
      lastFocusedBox.value = letter;

      const col = parseInt(lastFocusedBox.getAttribute("data-col"), 10);
      const row = parseInt(lastFocusedBox.getAttribute("data-row"), 10);
      const nextBox = document.querySelector(
        `[data-row="${row}"][data-col="${col + 1}"]`
      );

      if (nextBox) {
        setTimeout(() => nextBox.focus(), 50);
      }
    }
  };

  const handleInput = (e, rowIndex, colIndex) => {
    const input = e.target.value.toUpperCase();
    e.target.value = input;

    if (input && colIndex < 4) {
      const nextBox = document.querySelector(
        `[data-row="${rowIndex}"][data-col="${colIndex + 1}"]`
      );
      if (nextBox) nextBox.focus();
    }
  };

  const handleBackspace = () => {
    if (lastFocusedBox) {
      const col = parseInt(lastFocusedBox.getAttribute("data-col"), 10);
      const row = parseInt(lastFocusedBox.getAttribute("data-row"), 10);

      if (lastFocusedBox.value !== "") {
        lastFocusedBox.value = "";
      } else if (col > 0) {
        const previousBox = document.querySelector(
          `[data-row="${row}"][data-col="${col - 1}"]`
        );
        if (previousBox) {
          previousBox.value = "";
          previousBox.focus();
        }
      }
    }
  };

  const handleEnter = () => {
    const boxesInRow = document.querySelectorAll(`[data-row="${currentRow}"]`);
    const guess = Array.from(boxesInRow)
      .map((box) => box.value.trim().toUpperCase())
      .join("");

    const allFilled = Array.from(boxesInRow).every(
      (box) => box.value.trim() !== ""
    );

    if (allFilled && guess.length === 5) {
      if (validWords.includes(guess)) {
        const isCorrect = checkGuess(guess, currentRow);
        if (currentRow < 5 && !isCorrect) {
          setCurrentRow((prevRow) => prevRow + 1);
          setMessageState(" ");
        } else if (isCorrect) {
          setMessageState(
            `Congratulations! You guessed the correct word: ${secretWord}`
          );
        } else {
          setMessageState(`Game Over! The word was: ${secretWord}`);
        }
      } else {
        setMessageState("Invalid word. Try again.");
      }
    } else {
      setMessageState("Please fill all the boxes before pressing Enter.");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      handleBackspace();
    }
    if (e.key === "Enter") {
      e.preventDefault();
      handleEnter();
    }
  };

  const checkGuess = (guess, row) => {
    let guessCorrect = true;

    const letterCounts = {};
    for (const char of secretWord) {
      letterCounts[char] = (letterCounts[char] || 0) + 1;
    }

    const boxes = document.querySelectorAll(`[data-row="${row}"]`);
    const newAlphabetStatus = { ...alphabetStatus };

    boxes.forEach((box, i) => {
      const letter = guess[i];
      if (letter === secretWord[i]) {
        box.style.backgroundColor = "green";
        letterCounts[letter]--;
        newAlphabetStatus[letter] = "green";
      } else {
        guessCorrect = false;
      }
    });

    boxes.forEach((box, i) => {
      const letter = guess[i];
      if (letter !== secretWord[i]) {
        if (letterCounts[letter] > 0) {
          box.style.backgroundColor = "#808000";
          letterCounts[letter]--;
          newAlphabetStatus[letter] ||= "#808000";
        } else {
          box.style.backgroundColor = "gray";
          newAlphabetStatus[letter] ||= "gray";
        }
      }
    });

    setAlphabetStatus(newAlphabetStatus);
    return guessCorrect;
  };

  const renderRow = (rowIndex) => (
    <div className="grid-row" key={rowIndex}>
      {Array.from({ length: 5 }, (_, colIndex) => (
        <input
          key={`input-${rowIndex}-${colIndex}`}
          type="text"
          maxLength="1"
          className="grid-box"
          data-row={rowIndex}
          data-col={colIndex}
          ref={(el) => {
            if (colIndex === 0) {
              firstBoxRef.current[rowIndex] = el;
            }
          }}
          onFocus={handleFocus}
          onInput={(e) => handleInput(e, rowIndex, colIndex)}
          onKeyDown={handleKeyDown}
        />
      ))}
    </div>
  );

  const renderAlphabet = () => (
    <div className="alphabet-container">
      {alphabet.map((letter) => (
        <div
          key={letter}
          className={`alphabet-letter ${
            alphabetStatus[letter] === "gray" ? "gray" : ""
          }`}
          style={{ backgroundColor: alphabetStatus[letter] || "transparent" }}
          onClick={() => handleAlphabetClick(letter)}
        >
          {letter}
        </div>
      ))}
      <div
        className="alphabet-letter"
        style={{ backgroundColor: "gray", color: "white" }}
        onClick={handleBackspace}
      >
        Backspace
      </div>
      <div
        className="alphabet-letter"
        style={{ backgroundColor: "gray", color: "white" }}
        onClick={handleEnter}
      >
        Enter
      </div>
    </div>
  );

  return (
    <main>
      <Header />
      <div className="grid-container">
        {Array.from({ length: 6 }, (_, rowIndex) => renderRow(rowIndex))}
      </div>
      {renderAlphabet()}
      <h3>{message}</h3>
      <Footer />
    </main>
  );
};

export default App;
