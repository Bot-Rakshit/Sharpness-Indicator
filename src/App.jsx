import { useState, useEffect, useCallback } from 'react'
import { Chess } from 'chess.js'
import { Chessboard } from 'react-chessboard'
import './App.css'
import './Loader.css'
import MoveTable from './MoveTable'

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

  return (
    <div className="app">
      <h1>Chess Sharpness Calculator</h1>
      <div className="chess-container">
        <div className="chessboard-wrapper">
          <Chessboard 
            position={fen} 
            onPieceDrop={editMode ? undefined : onDrop}
            boardOrientation={editMode ? 'white' : undefined}
          />
        </div>
        <div className="side-panel">
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
              <button type="button" onClick={toggleEditMode}>
                {editMode ? 'Apply FEN' : 'Edit FEN'}
              </button>
              <button type="submit">Calculate</button>
              <button type="button" onClick={resetBoard}>Reset</button>
            </form>
            {isLoading ? (
              <div className="loader"></div>
            ) : (
              sharpness !== null && evaluation !== null && (
                <div className="results">
                  <p>Sharpness: {sharpness.toFixed(2)}</p>
                  <p>Stockfish Evaluation: {evaluation.toFixed(2)}</p>
                </div>
              )
            )}
          </div>
        </div>
      </div>
      <footer className="credit">
        <p>Made by Rakshit Singh for testing purposes</p>
      </footer>
    </div>
  )
}

export default App
