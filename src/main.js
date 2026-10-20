import { createApp } from 'vue'
import App from './App.vue'
import { createI18n } from 'vue-i18n'
import en from './locales/en-US.json'
import zh from './locales/zh-CN.json'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import './assets/main.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import { VueQueryPlugin } from '@tanstack/vue-query'

const i18n = createI18n({
    locale: 'en-US',
    fallbackLocale: 'en-US',
    messages: { 
      'en-US': en, 
      'zh-CN': zh 
    }
  });

const app = createApp(App)

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component)
  }
  
app.use(ElementPlus)
app.use(i18n)
app.use(VueQueryPlugin)
app.mount('#app')
