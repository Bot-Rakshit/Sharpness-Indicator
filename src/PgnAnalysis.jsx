import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const PgnAnalysis = ({ onMoveSelect, pgnText, onPgnLoaded }) => {
  const [analysis, setAnalysis] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (pgnText) {
      analyzePgn(pgnText);
    }
  }, [pgnText]);

  const analyzePgn = async (pgn) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('https://12d1-2406-7400-75-bb12-88d2-7886-2e25-3068.ngrok-free.app/analyze_pgn', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pgn: pgn }),
      });
      if (!response.ok) {
        throw new Error('Failed to analyze PGN');
      }
      const data = await response.json();
      if (data.analysis && data.analysis.length > 0) {
        setAnalysis(data.analysis);
        onPgnLoaded(data.moves);
      } else {
        throw new Error('No valid analysis data received');
      }
    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const chartData = {
    labels: analysis ? analysis.map((_, index) => `${Math.floor(index / 2) + 1}${index % 2 === 0 ? '.' : '...'}`) : [],
    datasets: [
      {
        label: 'Sharpness',
        data: analysis ? analysis.map(move => move.sharpness) : [],
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        tension: 0.1,
        pointRadius: 5,
        pointHoverRadius: 8,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: {
            size: 14,
          },
          color: 'white',
        },
      },
      title: {
        display: true,
        text: 'Sharpness Analysis',
        font: {
          size: 20,
          weight: 'bold',
        },
        color: 'white',
      },
      tooltip: {
        callbacks: {
          label: (context) => `Sharpness: ${context.parsed.y.toFixed(2)}`,
        },
        titleFont: {
          size: 14,
        },
        bodyFont: {
          size: 14,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Sharpness',
          font: {
            size: 16,
          },
          color: 'white',
        },
        ticks: {
          font: {
            size: 12,
          },
          color: 'white',
        },
      },
      x: {
        title: {
          display: true,
          text: 'Move',
          font: {
            size: 16,
          },
          color: 'white',
        },
        ticks: {
          font: {
            size: 12,
          },
          color: 'white',
        },
      },
    },
    onClick: (_, elements) => {
      if (elements.length > 0) {
        const clickedIndex = elements[0].index;
        onMoveSelect(clickedIndex);
      }
    },
  };

  return (
    <div className="pgn-analysis">
      {isLoading && <p>Analyzing PGN...</p>}
      {error && <p className="error-message">{error}</p>}
      {analysis && (
        <div className="chart-container">
          <Line data={chartData} options={chartOptions} />
        </div>
      )}
    </div>
  );
};

PgnAnalysis.propTypes = {
  onMoveSelect: PropTypes.func.isRequired,
  pgnText: PropTypes.string.isRequired,
  onPgnLoaded: PropTypes.func.isRequired,
};

export default PgnAnalysis;