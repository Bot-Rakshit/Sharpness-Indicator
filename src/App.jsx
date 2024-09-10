import { useState, useEffect, useCallback, useRef } from 'react'
import { Chess } from 'chess.js'
import { Chessboard } from 'react-chessboard'
import './App.css'
import './Loader.css'
import MoveTable from './MoveTable'
import PgnAnalysis from './PgnAnalysis'

function App() {
  const [game, setGame] = useState(new Chess())
  const [fen, setFen] = useState(game.fen())
  const [fenValue, setFenValue] = useState('')
  const [moves, setMoves] = useState([])
  const [currentMove, setCurrentMove] = useState(-1)
  const [editMode, setEditMode] = useState(false)
  const [sharpness, setSharpness] = useState(null)
  const [evaluation, setEvaluation] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [pgnText, setPgnText] = useState('')
  const dialogRef = useRef(null)

  useEffect(() => {
    setFenValue(game.fen())
  }, [game])

  const makeAMove = useCallback((move) => {
    const gameCopy = new Chess(game.fen())
    const result = gameCopy.move(move)
    if (result) {
      setGame(gameCopy)
      setFen(gameCopy.fen())
      const newMoves = [...moves, result.san]
      setMoves(newMoves)
      setCurrentMove(newMoves.length - 1)
    }
    return result
  }, [game, moves])

  const onDrop = useCallback((sourceSquare, targetSquare) => {
    const move = makeAMove({
      from: sourceSquare,
      to: targetSquare,
      promotion: 'q',
    })
    return move !== null
  }, [makeAMove])

  const handleFenSubmit = useCallback(() => {
    try {
      const newGame = new Chess(fenValue)
      setGame(newGame)
      setFen(newGame.fen())
      setMoves([])
      setCurrentMove(-1)
      setEditMode(false)
    } catch (error) {
      alert('Invalid FEN string')
    }
  }, [fenValue])

  const toggleEditMode = useCallback(() => {
    if (editMode) {
      handleFenSubmit();
    }
    setEditMode((prev) => !prev);
  }, [editMode, handleFenSubmit]);

  const handleMoveSelect = useCallback((index) => {
    const newGame = new Chess()
    for (let i = 0; i <= index; i++) {
      newGame.move(moves[i])
    }
    setGame(newGame)
    setFen(newGame.fen())
    setCurrentMove(index)
  }, [moves])

  const resetBoard = useCallback(() => {
    const newGame = new Chess()
    setGame(newGame)
    setFen(newGame.fen())
    setFenValue(newGame.fen())
    setMoves([])
    setCurrentMove(-1)
    setSharpness(null)
    setEvaluation(null)
  }, [])

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault()
    const currentFen = game.fen()
    setIsLoading(true)
    setSharpness(null)
    setEvaluation(null)
    try {
      const response = await fetch('https://12d1-2406-7400-75-bb12-88d2-7886-2e25-3068.ngrok-free.app/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fen: currentFen }),
      })
      const data = await response.json()
      setSharpness(data.sharpness)
      setEvaluation(data.evaluation)
    } catch (error) {
      console.error('Error submitting FEN:', error)
    } finally {
      setIsLoading(false)
    }
  }, [game])

  const handlePgnMoveSelect = useCallback((index) => {
    handleMoveSelect(index)
  }, [handleMoveSelect])

  const openPgnDialog = () => {
    if (dialogRef.current) {
      dialogRef.current.showModal()
    }
  }

  const closePgnDialog = () => {
    if (dialogRef.current) {
      dialogRef.current.close()
    }
  }

  const handlePgnSubmit = (e) => {
    e.preventDefault();
    closePgnDialog();
    if (pgnText.trim()) {
      const chess = new Chess();
      try {
        chess.loadPgn(pgnText);
        const loadedMoves = chess.history();
        if (loadedMoves.length > 0) {
          handlePgnLoaded(loadedMoves);
        } else {
          throw new Error('No moves found in PGN');
        }
      } catch (error) {
        console.error('Error loading PGN:', error);
        alert('Invalid PGN format or no moves found');
      }
    }
  }

  const handlePgnLoaded = (loadedMoves) => {
    if (loadedMoves && loadedMoves.length > 0) {
      setMoves(loadedMoves);
      const newGame = new Chess();
      try {
        loadedMoves.forEach(move => newGame.move(move));
        setGame(newGame);
        setFen(newGame.fen());
        setCurrentMove(loadedMoves.length - 1);
        setPgnText(newGame.pgn());
      } catch (error) {
        console.error('Error applying moves:', error);
        alert('Error applying moves from PGN');
      }
    } else {
      console.error('No moves loaded from PGN');
      alert('No valid moves found in the PGN');
    }
  }

  return (
    <div className="app">
      <header>
        <h1>Chess Sharpness Calculator</h1>
      </header>
      <main className="chess-container">
        <section className="chessboard-section">
          <Chessboard 
            position={fen} 
            onPieceDrop={editMode ? undefined : onDrop}
            boardOrientation={editMode ? 'white' : undefined}
          />
          <div className="board-controls">
            <button onClick={resetBoard}>Reset Board</button>
            <button onClick={openPgnDialog}>Analyze PGN</button>
          </div>
        </section>
        <section className="side-panel">
          {!editMode && (
            <div className="move-table-container">
              <MoveTable
                moves={moves}
                currentMove={currentMove}
                onMoveSelect={handleMoveSelect}
              />
            </div>
          )}
          <div className="fen-container">
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                value={fenValue}
                onChange={(e) => setFenValue(e.target.value)}
                placeholder="Enter FEN notation"
                disabled={!editMode}
              />
              <div className="fen-buttons">
                <button type="button" onClick={toggleEditMode}>
                  {editMode ? 'Apply FEN' : 'Edit FEN'}
                </button>
                <button type="submit">Calculate</button>
              </div>
            </form>
            {isLoading ? (
              <div className="loader"></div>
            ) : (
              sharpness !== null && evaluation !== null && (
                <div className="results">
                  <p>Sharpness: <span>{sharpness.toFixed(2)}</span></p>
                  <p>Stockfish Evaluation: <span>{evaluation.toFixed(2)}</span></p>
                </div>
              )
            )}
          </div>
        </section>
      </main>
      <PgnAnalysis onMoveSelect={handlePgnMoveSelect} pgnText={pgnText} onPgnLoaded={handlePgnLoaded} />
      <footer className="credit">
        <p>Made by Rakshit Singh for testing purposes</p>
      </footer>
      <dialog ref={dialogRef} className="pgn-dialog">
        <form onSubmit={handlePgnSubmit}>
          <h2>Paste your PGN here</h2>
          <textarea
            value={pgnText}
            onChange={(e) => setPgnText(e.target.value)}
            rows="10"
            cols="50"
          ></textarea>
          <div className="dialog-buttons">
            <button type="submit">Analyze</button>
            <button type="button" onClick={closePgnDialog}>Cancel</button>
          </div>
        </form>
      </dialog>
    </div>
  )
}

export default App
