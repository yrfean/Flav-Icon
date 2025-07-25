import { useEffect, useRef, useState } from "react";
import Swal from "sweetalert2";

const FlappyBird = () => {
  const canvasRef = useRef(null);
  const faviconCanvasRef = useRef(null);
  const [over, setOver] = useState(false);
  const [score, setScore] = useState(0);
  const [started, setStarted] = useState(false);
  const [gameId, setGameId] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    const stored = localStorage.getItem("highScore");
    return stored ? parseInt(stored, 10) : 0;
  });

  const handleGameOverAlert = () => {
    Swal.fire({
      title: "💥 Oops... Flappy Hit a Pipe!",
      text: "Looks like gravity won this round 😅",
      icon: "error",
      confirmButtonText: "🔄 Restart",
      showCancelButton: true,
      cancelButtonText: "🏠 Home",
      focusConfirm: false,
      focusCancel: false,
      allowEnterKey: false,
      allowOutsideClick: false,
      allowEscapeKey: false,
      customClass: {
        title: "text-yellow-400",
        popup: "bg-gray-900 text-white",
        confirmButton:
          "bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded",
        cancelButton:
          "bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded",
      },
    }).then((result) => {
      if (result.isConfirmed) {
        setOver(false);
        setScore(0);
        setGameId((id) => id + 1);
      } else {
        setStarted(false);
        setOver(false);
        setScore(0);
      }
    });
  };

  useEffect(() => {
    let interval;
    if (over) {
      let visible = true;
      interval = setInterval(() => {
        document.title = visible ? "💀 GAME OVER!" : "Flav-Icon";
        visible = !visible;
      }, 500);
    } else {
      document.title = "Flav-Icon";
    }
    return () => clearInterval(interval);
  }, [over]);

  useEffect(() => {
    if (over) {
      handleGameOverAlert();
    }
  }, [over]);

  useEffect(() => {
    const favicon = document.querySelector("link[rel='icon']");
    if (favicon) {
      favicon.href = "/bird.png";
    }

    if (started) return;

    const startListener = (e) => {
      if (e.code === "Space") setStarted(true);
    };

    document.addEventListener("keydown", startListener);
    return () => document.removeEventListener("keydown", startListener);
  }, [started]);

  useEffect(() => {
    if (!started) return;

    setOver(false);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const birdImage = new Image();
    birdImage.src = "/bird.png";

    let animationFrameId;
    let birdY = 300;
    let birdVelocity = 0;
    const gravity = 0.3;
    const jumpStrength = -8;

    const pipeWidth = 60;
    const pipeGap = 300;
    const pipeSpeed = 2;
    let pipes = [];
    let localScore = 0;

    let isGameActive = true;

    const pipeInterval = setInterval(() => {
      if (!isGameActive) return;
      const topPipeHeight = Math.random() * 300 + 50;
      pipes.push({
        x: canvas.width,
        top: topPipeHeight,
        bottom: canvas.height - topPipeHeight - pipeGap,
        scored: false,
      });
    }, 2000);

    const draw = () => {
      ctx.fillStyle = "#70c5ce";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      birdVelocity += gravity;
      birdY += birdVelocity;
      ctx.drawImage(birdImage, 100 - 20, birdY - 20, 100, 100);

      let isGameOver = false;

      pipes.forEach((pipe) => {
        const birdTop = birdY - 20;
        const birdBottom = birdY + 20;
        const birdLeft = 80;
        const birdRight = 120;
        const pipeLeft = pipe.x;
        const pipeRight = pipe.x + pipeWidth;

        if (birdRight > pipeLeft && birdLeft < pipeRight) {
          if (birdTop < pipe.top || birdBottom > canvas.height - pipe.bottom) {
            isGameOver = true;
          }
        }
        if (!pipe.scored && pipe.x + pipeWidth < birdLeft) {
          pipe.scored = true;
          localScore++;
          setScore(localScore);
          if (localScore > highScore) {
            setHighScore(localScore);
            localStorage.setItem("highScore", localScore.toString());
          }
        }
      });

      if (birdY + 20 > canvas.height || birdY - 20 < 0) {
        isGameOver = true;
      }

      if (isGameOver) {
        isGameActive = false;
        cancelAnimationFrame(animationFrameId);
        setOver(true);
        return;
      }

      ctx.fillStyle = "#4BAE4E";
      pipes.forEach((pipe, index) => {
        pipe.x -= pipeSpeed;
        ctx.fillRect(pipe.x, 0, pipeWidth, pipe.top);
        ctx.fillRect(
          pipe.x,
          canvas.height - pipe.bottom,
          pipeWidth,
          pipe.bottom
        );
        if (pipe.x + pipeWidth < 0) pipes.splice(index, 1);
      });

      const favCtx = faviconCanvasRef.current.getContext("2d");
      favCtx.clearRect(0, 0, 32, 32);
      favCtx.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, 32, 32);
      const link =
        document.querySelector("link[rel*='icon']") ||
        document.createElement("link");
      link.type = "image/png";
      link.rel = "icon";
      link.href = faviconCanvasRef.current.toDataURL("image/png");
      document.head.appendChild(link);

      document.title = `Score: ${localScore}`;
      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    const handleJump = (e) => {
      if (Swal.isVisible()) return;

      if (!isGameActive || e.code !== "Space") {
        return;
      }
      e.preventDefault();
      birdVelocity = jumpStrength;
    };

    window.addEventListener("keydown", handleJump);

    return () => {
      cancelAnimationFrame(animationFrameId);
      clearInterval(pipeInterval);
      window.removeEventListener("keydown", handleJump);
    };
  }, [started, gameId]);

  return (
    <>
      <div className="bg-[url('/bg.png')] flex justify-center items-center h-screen">
        {!started ? (
          <div className="text-center">
            <p className="fixed top-10 left-10 flex items-center gap-2 px-4 py-2 bg-black/20 border border-yellow-400 text-yellow-300 text-lg rounded-xl shadow-md backdrop-blur-sm">
              🏆 Highscore:{" "}
              <span className="font-bold text-yellow-200">{highScore}</span>
            </p>
            <h1 className="text-3xl font-bold mb-4">Welcome to Flav-icon</h1>
            <img
              src="/bird.png"
              alt="Bird Icon"
              className="mx-auto mb-2 w-16 h-16"
            />
            <p className="text-white mt-3 w-132 font-semibold text-center tracking-wide leading-snug text-xl">
              🐣 Flappy Favicon?! <br /> Yup, you're about to play Flappy
              Bird... in the tab icon. No full screen. No fancy graphics. Just
              pure chaos in 32×32 pixels. Hit Spacebar to flap. Look up — that
              tiny bird’s counting on you. 😵‍💫 🟢 Start if you dare.
            </p>
            <i className="text-yellow-100 block tracking-wider opacity-90 mt-5 animate-pulse">
              ~Press space key to start!
            </i>
          </div>
        ) : (
          <div className="text-center text-white">
            <canvas
              ref={faviconCanvasRef}
              width={32}
              height={32}
              style={{ display: "none" }}
            />

            <p className="text-5xl text-yellow-300 mb-3">Score: {score}</p>

            <p className="text-xl opacity-80">Highscore: {highScore}</p>

            <p className="text-white text-lg mt-5 opacity-60">
              Keep flapping..........! 🐦
            </p>
          </div>
        )}
        <canvas
          ref={canvasRef}
          width={400}
          height={600}
          className="absolute top-0 left-0 opacity-0 pointer-events-none"
        />
      </div>
      <footer className="text-center fixed bottom-2 left-0 w-full text-sm mt-10 opacity-70 text-gray-600">
        🐤 Built by{" "}
        <a
          href="https://github.com/yrfean/"
          className="font-semibold underline hover:text-yellow-300"
        >
          yrfan
        </a>{" "}
        – because making a whole game inside a tab icon seemed like a perfectly
        normal idea.
      </footer>
    </>
  );
};

export default FlappyBird;
