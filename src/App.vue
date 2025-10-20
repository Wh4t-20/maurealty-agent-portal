<template>
  <test />

  <LoginForm />
</template>

<script>
import LoginForm from './components/LoginForm.vue'
import test from './components/test.vue'

export default {
  name: 'App',
  components: {
    LoginForm,
    test,
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
</style>