// src/main.ts
// Entry point: creates the Vue app with the router (src/router/index.ts) and the global styles.

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './style.css'


createApp(App)
  .use(router)
  .mount('#app')
