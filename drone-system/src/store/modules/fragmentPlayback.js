// src/store/modules/fragmentPlayback.js
export default {
    namespaced: true,
  
    state: {
      currentFrame: 0,
      totalFrames: 0,
      isPlaying: false,
      isPaused: false,
      currentMatrix: Array(36).fill().map(() => Array(36).fill(0)),
      duration: 0,
      hasTerminal: false,  // 改用布尔值标识终端状态
      ws: null, // 新增:WebSocket连接实例
      seekDebounceTimer: null,
      lastSeekPosition: null,
    },
  
    mutations: {
      SET_CURRENT_FRAME(state, frame) {
        state.currentFrame = frame;
      },
      SET_TOTAL_FRAMES(state, total) {
        state.totalFrames = total;
        state.duration = total / 100;
      },
      SET_CURRENT_MATRIX(state, frame) {
        if (frame === null) {
            state.currentMatrix = Array(36).fill().map(() => Array(36).fill(0));
        } else if (Array.isArray(frame.matrix)) {
            state.currentMatrix = frame.matrix;
        }
    },
      SET_PLAYING(state, isPlaying) {
        state.isPlaying = isPlaying;
      },
      SET_PAUSED(state, isPaused) {
        state.isPaused = isPaused;
      },
      RESET_PLAYBACK(state) {
        state.currentFrame = 0;
        state.isPlaying = false;
        state.isPaused = false;
        state.currentMatrix = Array(36).fill().map(() => Array(36).fill(0));
      },
      CLEAR_PLAYBACK_DATA(state) {
        state.currentFrame = 0;
        state.totalFrames = 0;
        state.isPlaying = false;
        state.isPaused = false;
        state.currentMatrix = Array(36).fill().map(() => Array(36).fill(0));
        state.duration = 0;
      },
      SET_TERMINAL_WINDOW(state, isOpen) {
        state.hasTerminal = isOpen;
        if (state.ws) {
            state.ws.send(JSON.stringify({
                type: 'SET_TERMINAL',
                isOpen: isOpen
            }));
        }
    },
      SET_WEBSOCKET(state, ws) {
        state.ws = ws;
      },
      RESET_SEEK_POSITION(state) {
        state.lastSeekPosition = null;
      },
      HANDLE_PLAYBACK_STATE_UPDATE(state, data) {
        if (data.type === 'PLAYBACK_STATE_UPDATE') {
            state.isPlaying = data.playbackState.isPlaying;
            state.isPaused = data.playbackState.isPaused;
        }
    }
    },
  
    actions: {
    async connectWebSocket({ commit, state }) {
        if (state.ws) {
            state.ws.close();
        }

        const ws = new WebSocket(`ws://${window.location.hostname}:3000/pwm?type=fragment`);
        
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            switch (data.type) {
                case 'LOAD_SUCCESS':
                    commit('SET_TOTAL_FRAMES', data.totalFrames);
                    break;
                case 'FRAME':
                    commit('SET_CURRENT_FRAME', data.frameIndex);
                    commit('SET_CURRENT_MATRIX', {
                        matrix: data.matrix
                    });
                    // 处理终端输出
                    if (state.hasTerminal) {
                        localStorage.setItem('fragmentTerminalData', JSON.stringify({
                            type: 'MATRIX_UPDATE',
                            frameIndex: data.frameIndex,
                            matrix: JSON.stringify(data.matrix)
                        }));
                    }
                    break;
                case 'PLAYBACK_STATE_UPDATE':
                    commit('HANDLE_PLAYBACK_STATE_UPDATE', data);
                    break;
            }
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };
        
        ws.onclose = () => {
            console.log('WebSocket connection closed');
            commit('SET_WEBSOCKET', null);
        };

        commit('SET_WEBSOCKET', ws);
        return ws;
    },

      async loadPlaybackData({ state }, filename) {
        if (!state.ws) return;
        
        state.ws.send(JSON.stringify({
          type: 'LOAD_FILE',
          filename
        }));
      },
  
      async startPlayback({ state, commit }) {
        if (!state.ws) return;
        
        commit('SET_PLAYING', true);
        commit('SET_PAUSED', false);
        
        if (state.lastSeekPosition !== null) {
            state.ws.send(JSON.stringify({ 
                type: 'START',
                startFrame: state.lastSeekPosition
            }));
            state.lastSeekPosition = null;
        } else {
            state.ws.send(JSON.stringify({ type: 'START' }));
        }
    },

    pausePlayback({ state, commit }) {
        if (!state.ws) return;
        state.lastSeekPosition = state.currentFrame;
        commit('SET_PAUSED', true);
        state.ws.send(JSON.stringify({ type: 'PAUSE' }));
    },

    resumePlayback({ state, commit }) {
        if (!state.ws) return;
        commit('SET_PAUSED', false);
        state.ws.send(JSON.stringify({ type: 'RESUME' }));
    },

    stopPlayback({ state, commit }) {
        if (!state.ws) return;
        commit('SET_PLAYING', false);
        commit('SET_PAUSED', false);
        commit('SET_CURRENT_FRAME', 0);
        commit('SET_CURRENT_MATRIX', null);
        commit('RESET_SEEK_POSITION');
        state.ws.send(JSON.stringify({ type: 'STOP' }));
    },
  
    seekTo({ state, commit }, frameNumber) {
      if (!state.ws) return;
      
      if (state.seekDebounceTimer) {
          clearTimeout(state.seekDebounceTimer);
      }
      
      const wasPlaying = state.isPlaying && !state.isPaused;
      
      if (wasPlaying) {
          commit('SET_PLAYING', false);
          commit('SET_PAUSED', true);
      }
      
      state.seekDebounceTimer = setTimeout(() => {
          state.lastSeekPosition = frameNumber;
          
          state.ws.send(JSON.stringify({
              type: 'SEEK',
              frame: frameNumber,
              pause: true
          }));
  
          if (wasPlaying) {
              setTimeout(() => {
                  commit('SET_PLAYING', true);
                  commit('SET_PAUSED', false);
                  state.ws.send(JSON.stringify({ 
                      type: 'START',
                      startFrame: frameNumber
                  }));
              }, 100);
          }
      }, 50);
  },
  
      clearPlaybackData({ commit }) {
        commit('CLEAR_PLAYBACK_DATA');
      },
  
      // 用于处理从WebSocket接收到的帧数据
      handleFrameData({ commit, state }, frameData) {
        commit('SET_CURRENT_FRAME', frameData.frameIndex);
        commit('SET_CURRENT_MATRIX', frameData.matrix);
    
        // 如果终端窗口打开，通过 localStorage 发送数据
        if (state.hasTerminal) {
          const terminalData = {
            type: 'MATRIX_UPDATE',
            frameIndex: frameData.frameIndex,
            matrix: JSON.stringify(frameData.matrix)
          };
          localStorage.setItem('fragmentTerminalData', JSON.stringify(terminalData));
        }
      },
  
      // 处理WebSocket连接状态改变
      handleConnectionChange({ commit }, isConnected) {
        if (!isConnected) {
          commit('CLEAR_PLAYBACK_DATA');
        }
      }
    },
  
    getters: {
      playbackProgress: state => {
        if (!state.totalFrames) return 0;
        return (state.currentFrame / state.totalFrames) * 100;
      },
  
      currentTime: state => {
        const totalMilliseconds = (state.currentFrame / 100) * 1000;
        const minutes = Math.floor(totalMilliseconds / 60000);
        const seconds = Math.floor((totalMilliseconds % 60000) / 1000);
        const milliseconds = Math.floor((totalMilliseconds % 1000) / 10);
        
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(milliseconds).padStart(2, '0')}`;
      },
  
      totalTime: state => {
        const totalMilliseconds = state.duration * 1000;
        const minutes = Math.floor(totalMilliseconds / 60000);
        const seconds = Math.floor((totalMilliseconds % 60000) / 1000);
        const milliseconds = Math.floor((totalMilliseconds % 1000) / 10);
        
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(milliseconds).padStart(2, '0')}`;
      },
      
      matrixColors: state => {
        if (!state.currentMatrix) return null;
        
        return state.currentMatrix.map(row =>
          row.map(value => {
            if (value === 0) return 'rgb(232, 232, 232)';
            
            const percentage = Math.floor((value / 255) * 100);
            
            if (percentage <= 10) return '#B2DEF8';
            if (percentage <= 20) return '#9FD4F2';
            if (percentage <= 30) return '#8CC9EC';
            if (percentage <= 40) return '#79BFE6';
            if (percentage <= 50) return '#66B4E0';
            if (percentage <= 60) return '#53AADA';
            if (percentage <= 70) return '#409FD4';
            if (percentage <= 80) return '#2D95CE';
            if (percentage <= 90) return '#1A8AC8';
            return '#005474';
          })
        );
      }
    }
  };