import { createContext, useContext, useMemo, useReducer, useRef } from 'react';

const VideoPlayerContext = createContext();

const reducers = {
  SET_META(state, action) {
    return { ...state, meta: action.payload };
  },
  PLAY(state, _action) {
    return { ...state, playing: true };
  },
  PAUSE(state, _action) {
    return { ...state, playing: false };
  },
  TOGGLE_MUTE(state, _action) {
    return { ...state, muted: !state.muted };
  },
  SET_CURRENT_TIME(state, action) {
    return { ...state, currentTime: action.payload };
  },
  SET_DURATION(state, action) {
    return { ...state, duration: action.payload };
  },
};

function VideoReducer(state, action) {
  return reducers[action.type](state, action);
}

export function VideoProvider({ children }) {
  let [state, dispatch] = useReducer(VideoReducer, {
    playing: false,
    muted: false,
    duration: 0,
    currentTime: 0,
    meta: null,
  });
  let playerRef = useRef(null);

  let actions = useMemo(() => {
    return {
      play(data) {
        if (data) {
          dispatch({ type: 'SET_META', payload: data });

          if (playerRef.current.currentSrc !== data.video.src) {
            let playbackRate = playerRef.current.playbackRate;
            playerRef.current.src = data.video.src;
            playerRef.current.type = data.video.type;
            playerRef.current.load();
            playerRef.current.pause();
            playerRef.current.playbackRate = playbackRate;
            playerRef.currentTime = 0;
          }
        }

        playerRef.current.play();
      },
      pause() {
        playerRef.current.pause();
      },
      toggle(data) {
        this.isPlaying(data) ? actions.pause() : actions.play(data);
      },
      seekBy(amount) {
        playerRef.current.currentTime += amount;
      },
      seek(time) {
        playerRef.current.currentTime = time;
      },
      playbackRate(rate) {
        playerRef.current.playbackRate = rate;
      },
      toggleMute() {
        dispatch({ type: 'TOGGLE_MUTE' });
      },
      isPlaying(data) {
        return data
          ? state.playing && playerRef.current.currentSrc === data.video.src
          : state.playing;
      },
    };
  }, [state.playing]);

  let api = useMemo(() => ({ ...state, ...actions }), [state, actions]);

  // console.log('LOG: playerRef', playerRef);

  return (
    <>
      <VideoPlayerContext.Provider value={api}>
        {children}
      </VideoPlayerContext.Provider>
      <video
        className='block'
        ref={playerRef}
        onPlay={() => dispatch({ type: 'PLAY' })}
        onPause={() => dispatch({ type: 'PAUSE' })}
        onTimeUpdate={(event) => {
          dispatch({
            type: 'SET_CURRENT_TIME',
            payload: Math.floor(event.target.currentTime),
          });
        }}
        onDurationChange={(event) => {
          dispatch({
            type: 'SET_DURATION',
            payload: Math.floor(event.target.duration),
          });
        }}
        muted={state.muted}
      />
    </>
  );
}

export function useVideoPlayer(data) {
  let player = useContext(VideoPlayerContext);

  // console.log('LOG: player useVideoPlayer', player);

  return useMemo(
    () => ({
      ...player,
      play() {
        player.play(data);
      },
      toggle() {
        player.toggle(data);
      },
      get playing() {
        return player.isPlaying(data);
      },
    }),
    [player, data]
  );
}
