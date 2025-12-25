import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import './style.css';

// Vue-Sonner toast plugin (default import for Vue 3)
//import Sonner from 'vue-sonner';

const app = createApp(App);

app.use(createPinia());
app.use(router);
//app.use(Sonner);  // Global toast provider

app.mount('#app');