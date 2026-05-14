<template>
    <div class="new-fragment">
      <!-- 标题容器 -->
      <div class="title-container">
        <div class="form-title">
          <img src="@/assets/UI/新建蓝色.svg" alt="新建片段">
          <span>新建片段</span>
        </div>
      </div>
  
      <!-- 操作按钮 -->
      <div class="action-buttons">
        <button class="btn btn-save" @click="handleSave">
          <img src="@/assets/UI/保存白色.svg" alt="保存">
          <span>保存</span>
        </button>
        <button class="btn btn-cancel" @click="handleCancel">
          <img src="@/assets/UI/删除白色.svg" alt="取消">
          <span>取消</span>
        </button>
      </div>
  
      <!-- 表单内容 -->
      <div class="info-container">
        <div class="form-group">
          <label>片段名称</label>
          <input 
            type="text" 
            v-model="formData.title"
            placeholder="基础飞行控制片段"
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
          <label>片段简介</label>
          <textarea 
            v-model="formData.description"
            placeholder="请输入片段简介..."
          ></textarea>
        </div>
      </div>
    </div>
  </template>
  
  <script>
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import projectService from '@/services/projectService';

export default {
 name: 'NewFragment',
 
 props: {
   projectId: {
     type: String,
     required: true
   }
 },
 
 setup(props) {
   const router = useRouter();
   const route = useRoute();
   const formData = ref({
     title: '',
     creator: '',
     password: '',
     contact: '',
     description: ''
   });

   console.log('Props projectId:', props.projectId);
   console.log('Route query:', route.query);

   const handleSave = async () => {
     if (!formData.value.title || !formData.value.creator) {
       alert('请填写必要信息');
       return;
     }

     try {
       const projectId = props.projectId || route.query.projectId;
       console.log('Saving with projectId:', projectId);
       
       if (!projectId) {
         alert('未找到项目ID');
         return;
       }

       await projectService.createFragment(projectId, formData.value);
       router.push({
         path: '/experiment/edit',
         query: { projectId }
       });
     } catch (error) {
       console.error('保存片段失败:', error);
       alert('保存失败，请重试');
     }
   };

   const handleCancel = () => {
     const projectId = props.projectId || route.query.projectId;
     router.push({
       path: '/experiment/edit',
       query: { projectId }
     });
   };

   return {
     formData,
     handleSave,
     handleCancel
   };
 }
};
</script>
  
  <style lang="scss" scoped>
  .new-fragment {
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