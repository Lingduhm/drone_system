// experimentPlayback.js
export default {
  namespaced: true,

  state: {
    currentCoordinates: {
      x: 0,
      y: 0,
      z: 0
    },
    selectedFragment: null,
    currentFrame: 0,
    totalFrames: 0,
    isPlaying: false,
    isPaused: false,
    currentMatrix: Array(36).fill().map(() => Array(36).fill(0)),
    duration: 0,
    terminalWindow: null,
    isRecording: false,
    recordSaved: false,
    recordMetadata: null,
    ws: null,
    hasTerminal: false,
    isPlaybackMode: false, // 新增：标识是否为回放模式
  },

  mutations: {
    UPDATE_COORDINATES(state, { x, y, z }) {
      state.currentCoordinates = { x, y, z };
    },
    SET_CURRENT_FRAME(state, frame) {
      state.currentFrame = frame;
    },
    SET_TOTAL_FRAMES(state, total) {
      state.totalFrames = total;
      state.duration = total / 100;
    },
    SET_CURRENT_MATRIX(state, matrix) {
      state.currentMatrix = matrix;
    },
    SET_PLAYING(state, isPlaying) {
      state.isPlaying = isPlaying;
    },
    SET_PAUSED(state, isPaused) {
      state.isPaused = isPaused;
    },
    SET_WEBSOCKET(state, ws) {
      state.ws = ws;
    },
    SET_SELECTED_FRAGMENT(state, fragment) {
      state.selectedFragment = fragment;
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
    SET_PLAYBACK_MODE(state, isPlayback) {
      state.isPlaybackMode = isPlayback;
    },
    SET_DURATION(state, duration) {
      state.duration = duration;
    },
    CLEAR_PLAYBACK_DATA(state) {
      state.currentFrame = 0;
      state.isPlaying = false;
      state.isPaused = false;
      state.currentMatrix = Array(36).fill().map(() => Array(36).fill(0));
      state.currentCoordinates = { x: 0, y: 0, z: 0 };
      
      if (state.hasTerminal) {
        localStorage.setItem('experimentTerminalData', JSON.stringify({
          type: 'MATRIX_UPDATE',
          frameIndex: 0,
          matrix: JSON.stringify(state.currentMatrix),
          coordinates: { x: "0.00", y: "0.00", z: "0.00" }
        }));
      }
    }
  },

  actions: {
    async connectWebSocket({ commit, state, dispatch }, { projectId, fragmentId, mode = 'record', recordName }) {
      if (state.ws) {
        state.ws.close();
      }
    
      const wsUrl = `ws://${window.location.hostname}:3000/experiment?projectId=${projectId}&fragmentId=${fragmentId}&mode=${mode}`;
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        commit('SET_WEBSOCKET', ws);
        // 根据模式发送不同的初始化命令
        if (mode === 'playback' && recordName) {
          ws.send(JSON.stringify({
            type: 'INITIALIZE_PLAYBACK',
            projectId,
            fragmentId,
            recordName
          }));
        } else if (mode === 'record') {
          ws.send(JSON.stringify({
            type: 'INITIALIZE',
            projectId,
            fragmentId
          }));
        }
      };
    
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        dispatch('handleWSMessage', data);
      };
    
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    
      ws.onclose = () => {
        commit('SET_WEBSOCKET', null);
        commit('CLEAR_PLAYBACK_DATA');
      };
    },

    async loadRecordPlayback({ dispatch }, { data }) {
      dispatch('handleWSMessage', {
        type: 'LOAD_SUCCESS',
        totalFrames: data.frames.length,
        metadata: data.metadata
      });
    },

    async handleWSMessage({ commit, state }, data) {
      switch (data.type) {
        case 'LOAD_SUCCESS':
        case 'PLAYBACK_INITIALIZED':
          commit('SET_TOTAL_FRAMES', data.totalFrames);
          if (data.metadata?.duration) {
            commit('SET_DURATION', data.metadata.duration);
          }
          break;

          case 'FRAME': {
            commit('SET_CURRENT_FRAME', data.frameIndex);
            commit('SET_CURRENT_MATRIX', data.matrix);
            
            if (data.coordinates) {
              const position = data.coordinates.position;
              
              // 只将中心点坐标用于终端显示和表格
              if (Array.isArray(position) && position.length === 3) {
                const coords = {
                  x: parseFloat(position[0]).toFixed(2),
                  y: parseFloat(position[1]).toFixed(2),
                  z: parseFloat(position[2]).toFixed(2)
                };
                
                commit('UPDATE_COORDINATES', coords);
          
                const frameMs = (data.frameIndex / 100) * 1000;
                const minutes = Math.floor(frameMs / 60000);
                const seconds = Math.floor((frameMs % 60000) / 1000);
                const milliseconds = Math.floor((frameMs % 1000) / 10);
                const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(milliseconds).padStart(2, '0')}`;
          
                // 发送完整坐标数据给3D模型
                window.dispatchEvent(new CustomEvent('coordinate-update', {
                  detail: {
                    coordinates: data.coordinates,
                    time: timeStr
                  }
                }));
          
                // 只发送中心点坐标给XYZ表格
                window.dispatchEvent(new CustomEvent('xyz-coordinates-update', {
                  detail: {
                    time: timeStr,
                    x: coords.x,
                    y: coords.y,
                    z: coords.z
                  }
                }));
              }
            }
            
            if (state.hasTerminal) {
              const position = data.coordinates.position;
              if (Array.isArray(position) && position.length === 3) {
                localStorage.setItem('experimentTerminalData', JSON.stringify({
                  type: 'MATRIX_UPDATE',
                  frameIndex: data.frameIndex,
                  matrix: JSON.stringify(data.matrix),
                  coordinates: {
                    x: parseFloat(position[0]).toFixed(2),
                    y: parseFloat(position[1]).toFixed(2),
                    z: parseFloat(position[2]).toFixed(2)
                  }
                }));
              }
            }
            break;
          }
    
        case 'PLAYBACK_STATE_UPDATE':
          commit('SET_PLAYING', data.playbackState.isPlaying);
          commit('SET_PAUSED', data.playbackState.isPaused);
          break;
    
        case 'RECORD_COMPLETED':
          if (state.recordCompletedCallback) {
            state.recordCompletedCallback(data.fragmentId);
          }
          break;
      }
    },

    async startPlayback({ state, commit }) {
      if (!state.ws) return;
      commit('SET_PLAYING', true);
      commit('SET_PAUSED', false);
      state.ws.send(JSON.stringify({ type: 'START' }));
    },
  
    async pausePlayback({ state, commit }) {
      if (!state.ws) return;
      commit('SET_PAUSED', true);
      state.ws.send(JSON.stringify({ type: 'PAUSE' }));
    },
  
    async resumePlayback({ state, commit }) {
      if (!state.ws) return;
      commit('SET_PAUSED', false);
      state.ws.send(JSON.stringify({ type: 'RESUME' }));
    },
  
    async stopPlayback({ commit, state }) {
      if (!state.ws) return;
      
      // 发送停止命令到服务器
      state.ws.send(JSON.stringify({ type: 'STOP' }));

      // 清除当前播放状态
      commit('CLEAR_PLAYBACK_DATA');
      
      // 保持选中的记录，但重置相关状态
      if (state.isPlaybackMode) {
        commit('SET_TOTAL_FRAMES', 0);
        commit('SET_DURATION', 0);
      }
      
      // 重置3D场景
      window.dispatchEvent(new CustomEvent('coordinate-update', {
        detail: {
          coordinates: {
            position: [0, 0, 0],
            markers: {
              Marker1: [0, 0, 0],
              Marker2: [0, 0, 0],
              Marker3: [0, 0, 0],
              Marker4: [0, 0, 0]
            }
          },
          time: "00:00.00"
        }
      }));
      
      // 重置XYZ坐标表格
      window.dispatchEvent(new CustomEvent('xyz-coordinates-update', {
        detail: {
          time: "00:00.00",
          x: "0.00",
          y: "0.00",
          z: "0.00"
        }
      }));
    },
    
    async startRecordPlayback({ commit, state }, { recordName, fragmentId, projectId }) {
      if (state.ws) {
        commit('SET_PLAYING', true);
        commit('SET_PAUSED', false);
        
        // 发送回放初始化命令
        state.ws.send(JSON.stringify({
          type: 'INITIALIZE_PLAYBACK',
          projectId,
          fragmentId,
          recordName
        }));

        // 发送开始命令
        state.ws.send(JSON.stringify({ type: 'START' }));
      }
    },

    // 暂停回放
    async pauseRecordPlayback({ commit, state }) {
      if (state.ws) {
        commit('SET_PAUSED', true);
        state.ws.send(JSON.stringify({ type: 'PAUSE' }));
      }
    },

    // 恢复回放
    async resumeRecordPlayback({ commit, state }) {
      if (state.ws) {
        commit('SET_PAUSED', false);
        state.ws.send(JSON.stringify({ type: 'RESUME' }));
      }
    },

    setSelectedFragment({ commit }, fragment) {
      commit('SET_SELECTED_FRAGMENT', fragment);
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

      return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
        2,
        "0"
      )}.${String(milliseconds).padStart(2, "0")}`;
    },

    totalTime: state => {
      const totalMilliseconds = state.duration * 1000;
      const minutes = Math.floor(totalMilliseconds / 60000);
      const seconds = Math.floor((totalMilliseconds % 60000) / 1000);
      const milliseconds = Math.floor((totalMilliseconds % 1000) / 10);

      return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
        2,
        "0"
      )}.${String(milliseconds).padStart(2, "0")}`;
    },

    matrixColors: state => {
      if (!state.currentMatrix) return null;

      return state.currentMatrix.map(row =>
        row.map(value => {
          if (value === 0) return "rgb(232, 232, 232)";

          const percentage = Math.floor((value / 255) * 100);

          if (percentage <= 10) return "#B2DEF8";
          if (percentage <= 20) return "#9FD4F2";
          if (percentage <= 30) return "#8CC9EC";
          if (percentage <= 40) return "#79BFE6";
          if (percentage <= 50) return "#66B4E0";
          if (percentage <= 60) return "#53AADA";
          if (percentage <= 70) return "#409FD4";
          if (percentage <= 80) return "#2D95CE";
          if (percentage <= 90) return "#1A8AC8";
          return "#005474";
        })
      );
    }
  }
};