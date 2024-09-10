import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

const MoveTable = ({ moves, currentMove, onMoveSelect }) => {
  const moveListRef = useRef(null);

  useEffect(() => {
    if (moveListRef.current) {
      moveListRef.current.scrollTop = moveListRef.current.scrollHeight;
    }
  }, [moves]);

  return (
    <div className="move-table">
      <h3>Moves</h3>
      <div className="move-list" ref={moveListRef}>
        {Array.from({ length: Math.ceil(moves.length / 2) }, (_, i) => (
          <div key={i} className="move-row">
            <div
              className={`move-item ${i * 2 === currentMove ? 'current-move' : ''}`}
              onClick={() => onMoveSelect(i * 2)}
            >
              <span className="move-number">{i + 1}.</span>
              <span className="white-move">{moves[i * 2] || ''}</span>
            </div>
            {moves[i * 2 + 1] && (
              <div
                className={`move-item ${i * 2 + 1 === currentMove ? 'current-move' : ''}`}
                onClick={() => onMoveSelect(i * 2 + 1)}
              >
                <span className="black-move">{moves[i * 2 + 1]}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

MoveTable.propTypes = {
  moves: PropTypes.arrayOf(PropTypes.string).isRequired,
  currentMove: PropTypes.number.isRequired,
  onMoveSelect: PropTypes.func.isRequired,
};

export default MoveTable;