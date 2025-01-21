import { createRouter, createWebHistory } from 'vue-router'
import BaseLayout from '@/components/layout/BaseLayout.vue'
import store from '@/store'

const routes = [
  {
    path: '/',
    redirect: '/project'
  },
  {
    path: '/project',
    component: BaseLayout,
    props: {
      type: 'project'
    },
    children: [
      {
        path: '',
        name: 'ProjectList',
        meta: { title: '项目' }, 
        component: () => import('@/views/project/ProjectList.vue')
      },
      {
        path: 'new',
        name: 'NewProject',
        meta: { title: '项目', activeMenu: '/project' },
        component: () => import('@/views/project/NewProject.vue')
      }
    ]
  },
  {
    path: '/test',
    component: BaseLayout,
    props: {
      type: 'project'
    },
    children: [
      {
        path: '',
        name: 'Test',
        component: () => import('@/views/test/TestPage.vue'),
        children: [
          {
            path: '',
            name: 'TestMotion',
            component: () => import('@/views/test/TestMotion.vue')
          },
          {
            path: 'wind',
            name: 'TestWind',
            component: () => import('@/views/test/TestWind.vue')
          },
          {
            path: 'rain',
            name: 'TestRain',
            component: () => import('@/views/test/TestRain.vue')
          }
        ]
      }
    ]
  },
  {
    path: '/settings',
    component: BaseLayout,
    props: {
      type: 'project'
    },
    children: [
      {
        path: '',
        name: 'Settings',
        meta: { title: '设置' },
        component: () => import('@/views/settings/SettingsPage.vue')
      }
    ]
  },
  {
    path: '/about',
    component: BaseLayout,
    props: {
      type: 'project'
    },
    children: [
      {
        path: '',
        name: 'About',
        meta: { title: '关于' },
        component: () => import('@/views/about/AboutPage.vue')
      }
    ]
  },
  {
    path: '/experiment',
    component: BaseLayout,
    props: {
      type: 'experiment'
    },
    children: [
      {
        path: '',
        name: 'ExperimentMain',
        component: () => import('@/views/experiment/ExperimentPage.vue')
      },
      {
        path: 'edit',
        name: 'ExperimentEdit',
        component: () => import('@/views/experiment/EditFragment.vue'),
      },
      {
        path: 'settings',
        name: 'ExperimentSettings',
        component: () => import('@/views/experiment/ExperimentSettings.vue'),
      },
      {
        path: 'fragment/new',  
        name: 'NewFragment',
        component: () => import('@/views/experiment/NewFragment.vue'),
        // 添加 props 以确保可以获取到 query 参数
        props: (route) => ({ projectId: route.query.projectId })
      },
      {
        path: 'fragment/:id',  
        name: 'FragmentDetail',
        meta: { title: '片段编辑' },
        component: () => import('@/views/experiment/FragmentDetail.vue'),
        props: {
          type: 'fragment-detail'
        }
      }
    ],
    beforeEnter: (to, from, next) => {
      const projectId = to.query.projectId
      if (projectId && !store.state.navigation.experimentTitle) {
        const project = store.getters['projects/getProjectById'](projectId)
        if (project) {
          store.commit('navigation/SET_EXPERIMENT_TITLE', project.title)
        }
      }
      next()
    }
  },
  {
    path: '/template',
    component: BaseLayout,
    props: {
      type: 'project'
    },
    children: [
      {
        path: '',
        name: 'Template',
        meta: { title: '模板', activeMenu: '/template' },
        component: () => import('@/views/template/TemplatePage.vue')
      },
      {
        path: 'new',
        name: 'NewTemplate',
        meta: { title: '模板', activeMenu: '/template' },
        component: () => import('@/views/template/NewTemplate.vue')
      },
      {
        path: ':id',
        name: 'TemplateDetail',
        props: true, // 添加这行，确保route.params可以作为props传入
        component: () => import('@/views/template/TemplateDetail.vue')
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

router.beforeEach((to, from, next) => {
  // 修改逻辑：当从实验页面返回到项目页面时，并且不是通过直接导航到项目页面时，不清除实验标题
  if (to.path === '/project' && from.path.startsWith('/experiment')) {
    // 只有在点击"返回项目"按钮时才清除实验标题
    if (to.params.clearExperimentTitle) {
      store.commit('navigation/SET_EXPERIMENT_TITLE', null)
    }
  }
  
  // 处理实验相关页面的标题
  if (to.path.startsWith('/experiment')) {
    const projectId = to.query.projectId || from.query.projectId
    if (projectId) {
      const project = store.getters['projects/getProjectById'](projectId)
      if (project && !store.state.navigation.experimentTitle) {
        store.commit('navigation/SET_EXPERIMENT_TITLE', project.title)
      }
    }
  }
  
  // 处理模板相关页面
  else if (to.path.startsWith('/template')) {
    if (to.name === 'TemplateDetail') {
      const template = store.getters['templates/getTemplateById'](to.params.id)
      if (template) {
        store.commit('navigation/SET_TITLE', template.title)
      }
    } else {
      store.commit('navigation/SET_TITLE', '模板')
    }
  }
  // 处理测试页面及其子路由
  else if (to.path.startsWith('/test')) {
    store.commit('navigation/SET_TITLE', '测试')
  }
  // 处理其他普通路由
  else if (to.meta.title) {
    store.commit('navigation/SET_TITLE', to.meta.title)
  }

  next()
})
export default router