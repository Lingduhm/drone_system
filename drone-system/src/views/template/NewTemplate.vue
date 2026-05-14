<!-- src/views/template/NewTemplate.vue -->
<template>
  <div class="new-template">
    <!-- 标题容器 -->
    <div class="title-container">
      <div class="form-title">
        <img src="@/assets/UI/新建蓝色.svg" alt="新建模板">
        <span>新建模板</span>
      </div>
    </div>

    <!-- 操作按钮 -->
<div class="action-buttons">
  <button class="btn btn-save" @click="handleSave">
    <img src="@/assets/UI/保存白色.svg" alt="保存">
    <span>保存</span>
  </button>
  <button class="btn btn-cancel" @click="$router.push('/template')">
    <img src="@/assets/UI/删除白色.svg" alt="取消">
    <span>取消</span>
  </button>
</div>

    <!-- 模板信息容器 -->
    <div class="info-container">
      <!-- 模板名称输入 -->
      <div class="form-group">
        <label>模板名称</label>
        <input 
          type="text" 
          v-model="formData.title"
          placeholder="基础飞行训练模板"
        >
      </div>

      <!-- 负责人输入 -->
      <div class="form-group">
        <label>负责人</label>
        <input 
          type="text" 
          v-model="formData.creator"
          placeholder="张三"
        >
      </div>

      <!-- 密码输入 -->
      <div class="form-group">
        <label>密码 <span class="password-hint">仅支持数字</span></label>
        <input 
          type="password" 
          v-model="formData.password"
          placeholder="123456789"
        >
      </div>

      <!-- 联系电话输入 -->
      <div class="form-group">
        <label>联系电话</label>
        <input 
          type="tel" 
          v-model="formData.contact"
          placeholder="18088888888"
        >
      </div>

      <!-- 模板简介输入 -->
      <div class="form-group">
        <label>模板简介</label>
        <textarea 
          v-model="formData.description"
          placeholder="请输入模板简介..."
        ></textarea>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'

export default {
  name: 'NewTemplate',
  
  setup() {
    const store = useStore()
    const router = useRouter()  // 确保使用 router
    const currentType = computed(() => store.getters['templates/currentType'])

    
    const formData = ref({
      title: '',
      creator: '',
      password: '',
      contact: '',
      description: '',
      type: currentType.value // 注意这里要用 .value
    })

const handleSave = async () => {
  if (!formData.value.title || !formData.value.creator) {
    alert('请填写必要信息');
    return;
  }

  try {
    // 添加所有表单数据
    const templateData = {
      title: formData.value.title,
      creator: formData.value.creator,
      password: formData.value.password,
      contact: formData.value.contact,
      description: formData.value.description,
      ...formData.value,
      type: currentType.value // 模板类型
    };

    await store.dispatch('templates/addTemplate', templateData);
    router.push('/template');
  } catch (error) {
    console.error('保存模板失败:', error);
    alert('保存失败，请重试');
  }
}

    return {
      formData,
      handleSave
    }
  }
}
</script>

<style lang="scss" scoped>
.new-template {
  padding: 1vw;
}

.title-container {
  width: 36vw;
  background-color: transparent;
  padding: 0.8vw 1vw;
  margin-bottom: 1vw;
  border-top: 2px solid rgb(232, 232, 232);
  border-bottom: 2px solid rgb(232, 232, 232);
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
    background-color: rgb(232, 232, 232);
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
  width: 17vw; // 修改宽度为17vw
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
    border: 1px solid rgb(232, 232, 232);
    border-radius: 0.3vw;
    font-size: 0.9vw;
    
    &:focus {
      outline: none;
      border-color: #00A0E9;
    }
  }

  textarea {
    height: 10vw;
    resize: none;
  }
}
</style>