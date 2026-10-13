/**
 * src/main.ts
 *
 * Einstiegspunkt der Vue Applikation.
 * Initialisiert die App mit Pinia (State Management) und dem Vue Router,
 * und mountet sie in das DOM Element mit der ID `app`.
 */

import { createApp } from 'vue';
import { createPinia } from 'pinia'
import App from './App.vue';
import router from './router';

const app = createApp(App);

app.use(createPinia())
app.use(router);

app.mount('#app');
