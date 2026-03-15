import React, { useState, useEffect } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import io from 'socket.io-client';
import { RotateCcw, ArrowLeft, Swords } from 'lucide-react';
import toast from 'react-hot-toast';

const socket = io.connect('http://localhost:8000');

function ChessGame({ user, roomId, onBack, isWhite }) {
  // Game instance initialization
  const [game, setGame] = useState(new Chess());

  useEffect(() => {
    socket.emit("join_chat", roomId);

    // Jab partner move karega
    socket.on("receive_chess_move", (move) => {
      setGame((prevGame) => {
        const newGame = new Chess(prevGame.fen());
        try {
          newGame.move(move);
          return newGame;
        } catch (e) {
          return prevGame;
        }
      });
    });

    // Jab restart request aayegi
    socket.on("restart_chess_game", () => {
      setGame(new Chess());
      toast.success("Game Restart ho gaya! ✨");
    });

    return () => {
      socket.off("receive_chess_move");
      socket.off("restart_chess_game");
    };
  }, [roomId]);

  function onDrop(sourceSquare, targetSquare) {
    // 1. Turn Check: Kya user ki turn hai?
    const userColor = isWhite ? 'w' : 'b';
    if (game.turn() !== userColor) {
      toast.error("Abhi partner ki turn hai! Wait karo ✋");
      return false;
    }

    // 2. Move Execute karne ki koshish
    const moveData = {
      from: sourceSquare,
      to: targetSquare,
      promotion: 'q', // Hamesha queen mein promote hoga simplified rakhne ke liye
    };

    try {
      const gameCopy = new Chess(game.fen());
      const move = gameCopy.move(moveData);

      if (move === null) return false; // Illegal move

      // 3. State update aur Socket par bhejna
      setGame(gameCopy);
      socket.emit("send_chess_move", { roomId, move: moveData });

      // Special Alerts
      if (gameCopy.isCheckmate()) toast.success("🏆 CHECKMATE! Aap jeet gaye!");
      else if (gameCopy.isCheck()) toast.error("⚠️ Check!");

      return true;
    } catch (e) {
      return false;
    }
  }

  function handleReset() {
    socket.emit("restart_chess_request", { roomId });
  }

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded-[3rem] shadow-2xl border border-rose-100 animate-in fade-in zoom-in duration-300">
      <div className="flex justify-between items-center mb-6">
        <button onClick={onBack} className="p-3 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-all text-gray-500">
          <ArrowLeft size={20} />
        </button>
        
        <div className="flex flex-col items-center">
            <h3 className="text-xl font-black text-gray-800 italic flex items-center gap-2">
               <Swords className="text-rose-500" size={24}/> Chess Arena
            </h3>
            <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase mt-1 ${game.turn() === 'w' ? 'bg-orange-100 text-orange-600' : 'bg-gray-800 text-white'}`}>
                {game.turn() === 'w' ? "White's Turn" : "Black's Turn"}
            </span>
        </div>

        <button onClick={handleReset} className="p-3 bg-rose-50 text-rose-500 rounded-2xl hover:rotate-180 transition-all duration-500">
          <RotateCcw size={20}/>
        </button>
      </div>

      <div className="w-full aspect-square shadow-2xl rounded-xl overflow-hidden border-8 border-gray-50">
        <Chessboard 
          position={game.fen()} 
          onPieceDrop={onDrop} 
          boardOrientation={isWhite ? "white" : "black"}
          customDarkSquareStyle={{ backgroundColor: '#f43f5e' }} // Rose 500
          customLightSquareStyle={{ backgroundColor: '#fff1f2' }} // Rose 50
        />
      </div>

      <div className="mt-6 flex justify-center gap-4">
          <div className="px-4 py-2 bg-gray-50 rounded-2xl border border-gray-100">
              <p className="text-[10px] font-black text-gray-400 uppercase text-center">Aapka Side</p>
              <p className="text-sm font-bold text-gray-700">{isWhite ? "⚪ White (Pehle)" : "⚫ Black"}</p>
          </div>
      </div>
    </div>
  );
}

export default ChessGame;