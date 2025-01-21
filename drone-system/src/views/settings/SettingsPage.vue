<template>
  <div class="settings-page">
    <div class="action-buttons">
      <button class="btn btn-blue" @click="handleUpload">
        <img src="@/assets/UI/上传白色.svg" alt="上传">
        <span>上传配置文件</span>
      </button>
      <button class="btn btn-blue">
        <img src="@/assets/UI/下载白色.svg" alt="下载">
        <span>下载配置文件</span>
      </button>
    </div>

    <!-- 文件显示区域 -->
    <div v-if="uploadedFile" class="file-display">
      <img src="@/assets/UI/文件蓝色.svg" class="file-icon">
      <span class="file-name">{{ uploadedFile.name }}</span>
      <img src="@/assets/UI/确认蓝色.svg" class="check-icon">
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'

export default {
  name: 'SettingsPage',
  
  setup() {
    const uploadedFile = ref(null)

    const handleUpload = () => {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.json'
      input.onchange = (e) => {
        const file = e.target.files[0]
        if (file) {
          uploadedFile.value = file
        }
      }
      input.click()
    }

    return {
      uploadedFile,
      handleUpload
    }
  }
}
</script>

<style lang="scss" scoped>
.settings-page {
  padding: 1vw;
  margin: -1vw;
}

.action-buttons {
  display: flex;
  gap: 1vw;
  margin: 1vw 0;
}

.btn {
  width: 15.5vw;
  padding: 0.7vw 1vw;
  border: none;
  border-radius: 0.3vw;
  cursor: pointer;
  display: flex;
  align-items: center;
  color: white;
  transition: transform 0.3s;

  &.btn-blue {
    background-color: #00A0E9;
  }

  img {
    width: 1.2vw;
    height: 1.2vw;
    margin-right: 1vw;
  }

  span {
    font-size: 0.9vw;
  }

  &:hover {
    transform: scale(1.02);
  }
}

.file-display {
  background: transparent;
  border-radius: 0.3vw;
  padding: 0.8vw;
  display: flex;
  align-items: center;
  margin: 1vw 0;
  border-top: 2px solid rgb(232, 232, 232);
  border-bottom: 2px solid rgb(232, 232, 232);
  width: 32vw;

  .file-icon {
    width: 1.2vw;
    height: 1.2vw;
    margin-right: 1vw;
  }

  .file-name {
    flex: 1;
    font-size: 0.9vw;
    color: #333;
  }

  .check-icon {
    width: 1vw;
    height: 1vw;
  }
}
</style>