<<<<<<< HEAD
<script setup>
import loginForm from './components/login-form.vue';
</script>

<template>
  <router-view />
</template>

<style >

=======
<template>
  <LoginForm />
</template>
<script>
import LoginForm from './components/LoginForm.vue'

export default {
  name: 'App',
  components: {
    LoginForm
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
>>>>>>> 8059d13620da166e7220c345e7bbb66c23fdcaef
</style>
