<template>
  <div class="new-project">
    <!-- 标题栏 -->
    <div class="title-container">
      <div class="form-title">
        <img :src="newIcon" alt="新建项目">
        <span>新建项目</span>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="action-buttons">
      <button class="btn btn-save" @click="handleSave">
        <img :src="saveIcon" alt="保存">
        <span>保存</span>
      </button>
      <button class="btn btn-cancel" @click="handleCancel">
        <img :src="deleteIcon" alt="取消">
        <span>取消</span>
      </button>
    </div>

    <!-- 表单内容 -->
    <div class="info-container">
      <div class="form-group">
        <label>项目名称</label>
        <input 
          type="text" 
          v-model="formData.title"
          placeholder="基于PX4系统的人工智能增强学习无人机稳定系统研究"
        >
      </div>

      <div class="form-group">
        <label>负责人</label>
        <input 
          type="text" 
          v-model="formData.creator"
          placeholder="张三"
        >
      </div>

      <div class="form-group">
        <label>密码 <span class="password-hint">仅支持数字</span></label>
        <input 
          type="password" 
          v-model="formData.password"
          placeholder="123456789"
        >
      </div>

      <div class="form-group">
        <label>联系电话</label>
        <input 
          type="tel" 
          v-model="formData.contact"
          placeholder="18088888888"
        >
      </div>

      <div class="form-group">
        <label>项目简介</label>
        <textarea 
          v-model="formData.description"
          placeholder="请输入项目简介..."
        ></textarea>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'
import newIcon from '@/assets/UI/新建蓝色.svg'
import saveIcon from '@/assets/UI/保存白色.svg'
import deleteIcon from '@/assets/UI/删除白色.svg'

export default {
  name: 'NewProject',
  
  setup() {
    const router = useRouter()
    const store = useStore()
    const formData = ref({
      title: '',
      creator: '',
      password: '',
      contact: '',
      description: ''
    })

const handleSave = async () => {
  if (!formData.value.title || !formData.value.creator) {
    alert('请填写必要信息');
    return;
  }
  
  try {
    // 发送完整的表单数据
    const projectData = {
      ...formData.value  // 使用扩展运算符包含所有表单字段
    };

    await store.dispatch('projects/addProject', projectData);
    router.push('/project');
  } catch (error) {
    console.error('保存失败:', error);
    alert('保存失败，请重试');
  }
};

    const handleCancel = () => {
      router.push('/project')
    }

    return {
      formData,
      handleSave,
      handleCancel,
      // 图标
      newIcon,
      saveIcon,
      deleteIcon
    }
  }
}
</script>

<style lang="scss" scoped>
.new-project {
  padding: 1vw;
}

.title-container {
  width: 35vw;
  background-color: transparent;
  padding: 0.8vw 1vw;
  margin-bottom: 1vw;
  border-top: 2px solid #e8e8e8;
  border-bottom: 2px solid #e8e8e8;
}

.form-title {
  display: flex;
  align-items: center;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    left: 3.2vw;
    top: 50%;
    transform: translateY(-50%);
    width: 2px;
    height: 2.5vw;
    background-color: #e8e8e8;
  }

  img {
    width: 2.5vw;
    height: 2.5vw;
    margin-right: 1vw;
  }

  span {
    font-size: 1.8vw;
    font-weight: bold;
    margin-left: 1vw;
  }
}

.action-buttons {
  display: flex;
  gap: 1vw;
  margin: 1vw 0 1.5vw;
}

.btn {
  width: 17vw;
  padding: 0.7vw 1vw;
  border: none;
  border-radius: 0.3vw;
  cursor: pointer;
  font-size: 0.9vw;
  color: white;
  display: flex;
  align-items: left;
  justify-content: left;
  gap: 1vw;
  transition: transform 0.3s;

  img {
    width: 1.3vw;
    height: 1.3vw;
  }

  &:hover {
    transform: scale(1.02);
  }

  &.btn-save {
    background-color: #00A0E9;
  }

  &.btn-cancel {
    background-color: #e40041;
  }
}

.info-container {
  width: 35vw;
  background-color: white;
  padding: 1.5vw;
  border-radius: 0.5vw;
}

.form-group {
  margin-bottom: 1.5vw;

  &:last-child {
    margin-bottom: 0;
  }

  label {
    display: block;
    margin-bottom: 0.5vw;
    font-size: 1vw;
  }

  .password-hint {
    color: #999;
    font-size: 0.8vw;
    margin-left: 0.5vw;
  }

  input, textarea {
    width: 100%;
    padding: 0.8vw;
    border: 1px solid #e8e8e8;
    border-radius: 0.3vw;
    font-size: 0.9vw;
    outline: none;
    
    &:focus {
      border-color: #00A0E9;
    }
  }

  textarea {
    height: 10vw;
    resize: none;
  }
}
</style>