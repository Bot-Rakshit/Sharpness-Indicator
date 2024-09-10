import { useState, useEffect } from 'react'
import { Chess } from 'chess.js'
import { Chessboard } from 'react-chessboard'
import './App.css'
import './Loader.css' // Add this import
import MoveTable from './MoveTable';

function App() {
  const [game, setGame] = useState(new Chess())
  const [fen, setFen] = useState(game.fen())
  const [fenValue, setFenValue] = useState('')
  const [moves, setMoves] = useState([])
  const [currentMove, setCurrentMove] = useState(-1)
  const [editMode, setEditMode] = useState(false)
  const [sharpness, setSharpness] = useState(null)
  const [evaluation, setEvaluation] = useState(null)
  const [isLoading, setIsLoading] = useState(false) // Add this state

  useEffect(() => {
    setFenValue(game.fen())
  }, [game])

  function makeAMove(move) {
    const gameCopy = new Chess(game.fen())
    const result = gameCopy.move(move)
    setGame(gameCopy)
    setFen(gameCopy.fen())
    if (result) {
      const newMoves = [...moves, result.san]
      setMoves(newMoves)
      setCurrentMove(newMoves.length - 1)
    }
    return result
  }

  function onDrop(sourceSquare, targetSquare) {
    const move = makeAMove({
      from: sourceSquare,
      to: targetSquare,
      promotion: 'q', // always promote to queen for simplicity
    })
    return move !== null
  }

  function toggleEditMode() {
    setEditMode(!editMode)
    if (editMode) {
      // Exiting edit mode, apply the FEN
      handleFenSubmit()
    }
  }

  function handleFenSubmit() {
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
  }

  function handleMoveSelect(index) {
    const newGame = new Chess()
    for (let i = 0; i <= index; i++) {
      newGame.move(moves[i])
    }
    setGame(newGame)
    setFen(newGame.fen())
    setCurrentMove(index)
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    const currentFen = game.fen();
    setIsLoading(true); // Set loading to true when starting the request
    setSharpness(null); // Reset sharpness to remove previous result
    setEvaluation(null); // Reset evaluation to remove previous result
    try {
      const response = await fetch('https://12d1-2406-7400-75-bb12-88d2-7886-2e25-3068.ngrok-free.app/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fen: currentFen }),
      });
      const data = await response.json();
      setSharpness(data.sharpness);
      setEvaluation(data.evaluation);
    } catch (error) {
      console.error('Error submitting FEN:', error);
    } finally {
      setIsLoading(false); // Set loading to false when the request is complete
    }
  };

  return (
    <div className="app">
      <h1>Sharpness Calculator</h1>
      <div className="chess-container">
        <Chessboard 
          position={fen} 
          onPieceDrop={editMode ? undefined : onDrop}
          boardOrientation={editMode ? 'white' : undefined}
        />
        {!editMode && (
          <MoveTable
            moves={moves}
            currentMove={currentMove}
            onMoveSelect={handleMoveSelect}
          />
        )}
      </div>
      <div className="fen-container">
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={fenValue}
            onChange={(e) => setFenValue(e.target.value)}
            placeholder="Enter FEN notation"
            disabled={!editMode}
          />
          <button type="button" onClick={toggleEditMode}>
            {editMode ? 'Apply FEN' : 'Edit FEN'}
          </button>
          <button type="submit">Calculate Sharpness</button>
        </form>
        {isLoading ? (
          <div className="loader"></div>
        ) : (
          <div className="results">
            {sharpness !== null && (
              <p>Sharpness: {sharpness.toFixed(2)}</p>
            )}
            {evaluation !== null && (
              <p>Stockfish Evaluation: {evaluation.toFixed(2)}</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default App
